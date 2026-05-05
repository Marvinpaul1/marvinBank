const crypto = require("crypto");

class NibssService {
  static BASE_URL = "https://nibssbyphoenix.onrender.com/api";

  static #token = null;
  static #tokenExpiry = null;

  // ─── Auth ──────────────────────────────────────────────────────────────────

  static async #getValidToken() {
    // if (this.#token && this.#tokenExpiry > Date.now()) {
    //   return this.#token;
    // }

    const response = await fetch(`${this.BASE_URL}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: process.env.NIBSS_API_KEY,
        apiSecret: process.env.NIBSS_SECRET_KEY,
      }),
    });

    if (!response.ok) {
      throw new Error("NIBSS authentication failed");
    }

    const data = await response.json();
    this.#token = data.token;
    this.#tokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour cache

    console.log("✅ NIBSS token acquired and cached");
    return this.#token;
  }

  // Shared fetch helper — handles auth + error parsing for all protected routes
  static async #authorizedRequest(path, method = "GET", body = null) {
    const token = await this.#getValidToken();

    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    };

    if (body) options.body = JSON.stringify(body);

    const response = await fetch(`${this.BASE_URL}${path}`, options);
    const data = await response.json().catch(() => ({}));

    console.log("NIBSS Response Status:", response.status);
    console.log("NIBSS Response Body:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error(data.message || `NIBSS error: HTTP ${response.status}`);
    }

    return data;
  }

  // ─── BVN ──────────────────────────────────────────────────────────────────

  static async insertBvn(data) {
    if (!data.bvn || data.bvn.length !== 11) {
      throw new Error("Invalid BVN: must be 11 digits");
    }

    const response = await fetch(`${this.BASE_URL}/insertBvn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "BVN insertion failed");
    }

    return response.json();
  }

  static async validateBvn(bvn) {
    return this.#authorizedRequest("/validateBvn", "POST", { bvn });
  }

  // ─── Account ──────────────────────────────────────────────────────────────

  static async createAccount(data) {
    console.log("🔄 [createAccount] Payload:", data);
    const result = await this.#authorizedRequest(
      "/account/create",
      "POST",
      data,
    );
    console.log("✅ [createAccount] Success:", result);
    return result;
  }

  // Resolve account number → account holder name
  // Used before every transfer to verify recipient
  static async nameEnquiry(accountNumber) {
    if (!accountNumber || accountNumber.length !== 10) {
      throw new Error("Invalid account number: must be 10 digits");
    }

    console.log(`🔄 [nameEnquiry] Looking up account: ${accountNumber}`);
    const result = await this.#authorizedRequest(
      `/account/name-enquiry/${accountNumber}`,
    );
    console.log(`✅ [nameEnquiry] Found: ${result.accountName}`);
    return result; // { accountNumber, accountName, bankName }
  }

  static async getBalance(accountNumber) {
    return this.#authorizedRequest(`/account/balance/${accountNumber}`);
  }

  // ─── Transfer ─────────────────────────────────────────────────────────────

  // Initiate interbank transfer via NIBSS settlement layer
  // Returns { transactionId, status, amount, from, to }
  static async transfer({ from, to, amount }) {
    // ✅ Add this first
    console.log("🔍 NibssService.transfer() called with:", {
      from,
      to,
      amount,
    });
    console.log("Types:", {
      from: typeof from,
      to: typeof to,
      amount: typeof amount,
    });
    console.log("Falsy check:", {
      fromFalsy: !from,
      toFalsy: !to,
      amountFalsy: !amount,
    });

    const numericAmount = Number(amount);

    if (!from || !to || !numericAmount) {
      throw new Error("from, to and amount are required for transfer");
    }
    // ... rest of method

    if (from === to) {
      throw new Error(
        "Sender and recipient account numbers cannot be the same",
      );
    }

    if (Number(amount) <= 0) {
      throw new Error("Transfer amount must be greater than zero");
    }

    console.log(`🔄 [transfer] ₦${amount} from ${from} → ${to}`);

    const result = await this.#authorizedRequest("/transfer", "POST", {
      from,
      to,
      amount: String(amount), // NIBSS expects amount as string
    });

    console.log(
      `✅ [transfer] Success — TxID: ${result.transactionId || result.reference}`,
    );
    return result; // { message, transactionId, amount, from, to, status }
  }

  // Query transaction status using TSQ ID returned by transfer()
  static async getTransactionStatus(transactionId) {
    if (!transactionId) {
      throw new Error("transactionId is required");
    }

    console.log(`🔄 [TSQ] Querying: ${transactionId}`);
    const result = await this.#authorizedRequest(
      `/transaction/${transactionId}`,
    );
    console.log(`✅ [TSQ] Status: ${result.status}`);
    return result; // { transactionId, status, amount, from, to, timestamp }
  }
}

module.exports = NibssService;

// Todo when i come back test fransfer
