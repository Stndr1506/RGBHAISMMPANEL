const crypto = require("crypto");

const IV = "@@@@&&&&####$$$$";

function encrypt(input, key) {
  const cipher = crypto.createCipheriv(
    "aes-128-cbc",
    Buffer.from(key),
    Buffer.from(IV)
  );

  let encrypted = cipher.update(input, "utf8", "base64");
  encrypted += cipher.final("base64");

  return encrypted;
}

function decrypt(input, key) {
  const decipher = crypto.createDecipheriv(
    "aes-128-cbc",
    Buffer.from(key),
    Buffer.from(IV)
  );

  let decrypted = decipher.update(
    input,
    "base64",
    "utf8"
  );

  decrypted += decipher.final("utf8");

  return decrypted;
}

function generateRandomString(length) {
  const chars =
    "9876543210ZYXWVUTSRQPONMLKJIHGFEDCBAabcdefghijklmnopqrstuvwxyz!@#$&_";

  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(
      Math.floor(Math.random() * chars.length)
    );
  }

  return result;
}

function calculateHash(params, salt) {
  const finalString = `${params}|${salt}`;

  const hash = crypto
    .createHash("sha256")
    .update(finalString)
    .digest("hex");

  return `${hash}${salt}`;
}

function generateSignature(params, key) {
  if (
    typeof params !== "string" &&
    typeof params !== "object"
  ) {
    throw new Error(
      "String or object expected"
    );
  }

  const paramString =
    typeof params === "string"
      ? params
      : JSON.stringify(params);

  const salt = generateRandomString(4);

  const hashString =
    calculateHash(paramString, salt);

  return encrypt(hashString, key);
}



function verifySignature(
  params,
  key,
  checksum
) {
  try {
    if (!checksum) {
      return false;
    }

    const paramString =
      typeof params === "string"
        ? params
        : JSON.stringify(params);

    const decrypted =
      decrypt(checksum, key);

    const salt =
      decrypted.substring(
        decrypted.length - 4
      );

    const expected =
      calculateHash(
        paramString,
        salt
      );

    return decrypted === expected;
  } catch (error) {
    console.error(
      "Paytm checksum verification error:",
      error
    );

    return false;
  }
}

module.exports = {
  generateSignature,
  verifySignature,
};
