# Sentiment training data

`training.tsv` is derived from the **Train.csv** split of UIT-ViSFD (UIT Vietnamese Smartphone Feedback Dataset), authored by researchers at the University of Information Technology, VNU-HCM. It contains 3,501 Vietnamese e-commerce smartphone reviews whose human labels mention either the camera (`CAMERA`) or sales/accessories (`SER&ACC`) aspect.

Source repository: https://github.com/LuongPhan/UIT-ViSFD

The source labels sentiment by aspect. We keep only reviews with a camera/accessories aspect label, then derive one training label by majority vote across all aspect polarities on that comment; ties are excluded. Resulting labels: 2,202 positive, 330 neutral, 969 negative. Only the training split is used; development and test splits are excluded. This filters training data toward the camera/accessories vocabulary, but comments are still from smartphone reviews, not dedicated camera rental reviews.

This dataset is made available for research purposes; contact the authors before commercial use. Please cite:

Phan et al. (2021), “SA2SL: From Aspect-Based Sentiment Analysis to Social Listening System for Business Intelligence,” Knowledge Science, Engineering and Management, Springer. https://doi.org/10.1007/978-3-030-82147-0_53
