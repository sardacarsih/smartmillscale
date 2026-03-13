package utils

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"io"
)

// EncryptionKey represents the encryption key used for API keys
var encryptionKey []byte

// InitializeEncryption initializes the encryption with a key derived from the app name
func InitializeEncryption(appSecret string) error {
	if appSecret == "" {
		// Generate a default key if no secret provided (not recommended for production)
		appSecret = "SmartMillScale-Default-Key-2024"
	}

	// Create a 32-byte key from the app secret
	hash := sha256.Sum256([]byte(appSecret))
	encryptionKey = hash[:]
	return nil
}

// Encrypt encrypts plaintext using AES-GCM
func Encrypt(plaintext string) (string, error) {
	if len(encryptionKey) == 0 {
		return "", fmt.Errorf("encryption not initialized")
	}

	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// Decrypt decrypts ciphertext using AES-GCM
func Decrypt(ciphertext string) (string, error) {
	if len(encryptionKey) == 0 {
		return "", fmt.Errorf("encryption not initialized")
	}

	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", err
	}

	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("ciphertext too short")
	}

	nonce, ciphertext_bytes := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext_bytes, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}

// IsInitialized checks if encryption is properly initialized
func IsInitialized() bool {
	return len(encryptionKey) > 0
}