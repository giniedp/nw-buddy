package serve

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"log/slog"
	"math/big"
	"net"
	"os"
	"path"
	"time"
)

// ensureCertificate returns a self-signed certificate for localhost.
// It is generated once into dir (cert.pem, key.pem) and regenerated when missing or about to expire.
// Browsers accept it after it is trusted, e.g. on windows: certutil -user -addstore Root <dir>/cert.pem
func ensureCertificate(dir string) (tls.Certificate, string, error) {
	certFile := path.Join(dir, "cert.pem")
	keyFile := path.Join(dir, "key.pem")
	if cert, err := tls.LoadX509KeyPair(certFile, keyFile); err == nil {
		if leaf, err := x509.ParseCertificate(cert.Certificate[0]); err == nil && time.Until(leaf.NotAfter) > 7*24*time.Hour {
			return cert, certFile, nil
		}
	}

	slog.Info("generating tls certificate", "dir", dir)
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		return tls.Certificate{}, "", err
	}
	serial, err := rand.Int(rand.Reader, new(big.Int).Lsh(big.NewInt(1), 128))
	if err != nil {
		return tls.Certificate{}, "", err
	}
	hostname, _ := os.Hostname()
	template := x509.Certificate{
		SerialNumber:          serial,
		Subject:               pkix.Name{CommonName: "nwbt localhost", Organization: []string{"nw-buddy nwbt"}},
		NotBefore:             time.Now().Add(-time.Hour),
		NotAfter:              time.Now().AddDate(2, 0, 0),
		KeyUsage:              x509.KeyUsageDigitalSignature | x509.KeyUsageCertSign,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
		IsCA:                  true,
		DNSNames:              []string{"localhost"},
		IPAddresses:           []net.IP{net.IPv4(127, 0, 0, 1), net.IPv6loopback},
	}
	if hostname != "" {
		template.DNSNames = append(template.DNSNames, hostname)
	}
	der, err := x509.CreateCertificate(rand.Reader, &template, &template, &key.PublicKey, key)
	if err != nil {
		return tls.Certificate{}, "", err
	}
	keyDer, err := x509.MarshalECPrivateKey(key)
	if err != nil {
		return tls.Certificate{}, "", err
	}
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		return tls.Certificate{}, "", err
	}
	if err := os.WriteFile(certFile, pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: der}), 0644); err != nil {
		return tls.Certificate{}, "", err
	}
	if err := os.WriteFile(keyFile, pem.EncodeToMemory(&pem.Block{Type: "EC PRIVATE KEY", Bytes: keyDer}), 0600); err != nil {
		return tls.Certificate{}, "", err
	}
	cert, err := tls.LoadX509KeyPair(certFile, keyFile)
	return cert, certFile, err
}
