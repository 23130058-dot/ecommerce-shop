# ZaloPay Sandbox setup

Wallet top-ups use the ZaloPay Sandbox test merchant from the official getting-started guide. The default AppID and test keys are supplied by ZaloPay for integration experiments; they do not represent a live merchant account.

1. Start PostgreSQL, then start the Spring Boot backend. Flyway creates the `wallet_topup_requests` table automatically.
2. Start the frontend and sign in.
3. Open **Cài đặt tài khoản → Thanh toán & Ví** or **Renter → Ví**, enter an amount from 10,000đ to 50,000,000đ, and choose **Thanh toán bằng ZaloPay**.
4. Complete the payment in ZaloPay Sandbox. The app returns to LensRent and verifies the signed redirect plus the server-side ZaloPay order status before crediting the wallet.

The local redirect defaults to `http://localhost:5173/wallet/top-up-result`. Set `ZALOPAY_REDIRECT_URL` if the frontend is reached through a different host or port.

The sandbox AppID and keys can be overridden with `ZALOPAY_APP_ID`, `ZALOPAY_KEY1`, and `ZALOPAY_KEY2`. API endpoints can be overridden with `ZALOPAY_CREATE_ORDER_ENDPOINT` and `ZALOPAY_QUERY_ORDER_ENDPOINT`. `ZALOPAY_ENABLED=false` disables top-ups.

The optional ZaloPay callback endpoint is `POST /api/account/wallet/top-ups/zalopay/callback`. It must be reachable from ZaloPay and configured in the sandbox merchant portal to receive callbacks. Local testing does not require a public callback URL because the signed return page verifies payment by querying ZaloPay from the backend.

For sandbox account setup, the official guide provides the test merchant credentials and links for the ZaloPay Sandbox app: [ZaloPay Developer – Getting started](https://developer.zalopay.vn/v1/start/).

