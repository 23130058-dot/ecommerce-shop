package com.example.ecommerceshop.review;

import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/** Trains a multinomial Naive Bayes baseline from the camera/accessories subset of UIT-ViSFD. */
@Component
public class SentimentClassifier {
    private static final List<String> LABELS = List.of("POSITIVE", "NEUTRAL", "NEGATIVE");
    private static final Pattern NON_WORD = Pattern.compile("[^a-z0-9]+", Pattern.CASE_INSENSITIVE);
    private final Map<String, Map<String, Integer>> wordCounts = new HashMap<>();
    private final Map<String, Integer> tokenTotals = new HashMap<>();
    private final Map<String, Integer> documentCounts = new HashMap<>();
    private final Set<String> vocabulary = new HashSet<>();
    private final JdbcTemplate jdbc;
    private int trainingSize;

    public SentimentClassifier(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @PostConstruct
    synchronized void train() {
        reset();
        loadBundledDataset();
        trainFromAdminCorrections();
        validateTrainingData();
    }

    public synchronized int retrainWithAdminCorrections() {
        reset();
        loadBundledDataset();
        trainFromAdminCorrections();
        validateTrainingData();
        return trainingSize;
    }

    private void reset() {
        wordCounts.clear();
        tokenTotals.clear();
        documentCounts.clear();
        vocabulary.clear();
        trainingSize = 0;
    }

    private void loadBundledDataset() {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                new ClassPathResource("sentiment/training.tsv").getInputStream(), StandardCharsets.UTF_8))) {
            reader.lines().forEach(line -> {
                int separator = line.indexOf('\t');
                if (separator <= 0 || separator == line.length() - 1) return;
                String label = line.substring(0, separator).trim().toUpperCase(Locale.ROOT);
                if (!LABELS.contains(label)) return;
                addSample(label, line.substring(separator + 1));
            });
        } catch (Exception exception) {
            throw new IllegalStateException("Không thể nạp dataset huấn luyện sentiment.", exception);
        }
    }

    private void trainFromAdminCorrections() {
        jdbc.query("SELECT comment,sentiment FROM product_reviews WHERE sentiment_source='ADMIN' AND sentiment IS NOT NULL",
                (RowCallbackHandler) rs -> addSample(rs.getString("sentiment"), rs.getString("comment")));
    }

    private void addSample(String label, String text) {
        List<String> tokens = tokenize(text);
        if (tokens.isEmpty() || !LABELS.contains(label)) return;
        trainingSize++;
        documentCounts.merge(label, 1, Integer::sum);
        Map<String, Integer> counts = wordCounts.computeIfAbsent(label, ignored -> new HashMap<>());
        for (String token : tokens) {
            vocabulary.add(token);
            counts.merge(token, 1, Integer::sum);
            tokenTotals.merge(label, 1, Integer::sum);
        }
    }

    private void validateTrainingData() {
        if (trainingSize == 0 || LABELS.stream().anyMatch(label -> !documentCounts.containsKey(label))) {
            throw new IllegalStateException("Dataset sentiment phải có dữ liệu cho cả 3 nhãn.");
        }
    }

    public synchronized Prediction predict(String text) {
        List<String> tokens = tokenize(text);
        Map<String, Double> logScores = new HashMap<>();
        int vocabularySize = Math.max(vocabulary.size(), 1);
        for (String label : LABELS) {
            double score = Math.log((double) documentCounts.get(label) / trainingSize);
            Map<String, Integer> counts = wordCounts.get(label);
            int total = tokenTotals.getOrDefault(label, 0);
            for (String token : tokens) {
                score += Math.log((counts.getOrDefault(token, 0) + 1.0) / (total + vocabularySize));
            }
            logScores.put(label, score);
        }
        double max = logScores.values().stream().mapToDouble(Double::doubleValue).max().orElse(0);
        double sum = logScores.values().stream().mapToDouble(score -> Math.exp(score - max)).sum();
        String best = LABELS.stream().max((left, right) -> Double.compare(logScores.get(left), logScores.get(right))).orElse("NEUTRAL");
        double confidence = sum == 0 ? 0 : Math.exp(logScores.get(best) - max) / sum;
        return new Prediction(best, confidence);
    }

    private List<String> tokenize(String text) {
        String folded = Normalizer.normalize(text == null ? "" : text.toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "").replace('đ', 'd');
        String normalized = NON_WORD.matcher(folded).replaceAll(" ").trim();
        if (normalized.isEmpty()) return List.of();
        List<String> tokens = new ArrayList<>();
        for (String token : normalized.split("\\s+")) if (token.length() > 1) tokens.add(token);
        return tokens;
    }

    public record Prediction(String label, double confidence) {}
}
