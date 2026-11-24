
const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";

const getEncryptionKey = () => {
  const secret = process.env.PROVIDER_ENCRYPTION_KEY;

  if (!secret || !/^[0-9a-fA-F]{64}$/.test(secret)) {
    throw new Error(
      "PROVIDER_ENCRYPTION_KEY must be a valid 64-character hexadecimal secret"
    );
  }

  return Buffer.from(secret, "hex");
};

const encrypt = (plainText) => {
  if (!plainText || typeof plainText !== "string") {
    throw new Error("API key is required for encryption");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
};

const decrypt = (encryptedText) => {
  if (!encryptedText || typeof encryptedText !== "string") {
    throw new Error("Encrypted API key is required");
  }

  const parts = encryptedText.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted API key format");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;

  if (
    !/^[0-9a-f]{24}$/i.test(ivHex) ||
    !/^[0-9a-f]{32}$/i.test(authTagHex) ||
    !/^(?:[0-9a-f]{2})+$/i.test(encryptedHex)
  ) {
    throw new Error("Invalid encrypted API key data");
  }

  const key = getEncryptionKey();

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};

module.exports = {
  encrypt,
  decrypt,
};
