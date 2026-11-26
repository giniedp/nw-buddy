package main

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

// nwbtPrefix is where the page reaches nwbt: on the page's own origin, through the asset server. The requests do not
// open connections from the WebView to 127.0.0.1, so the limit of 6 connections per host of HTTP/1.1 does not apply.
const nwbtPrefix = "/nwbt"

// nwbtProxy forwards the requests under nwbtPrefix to the running nwbt, the others to next
func nwbtProxy(sidecar *Sidecar, next http.Handler) http.Handler {
	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.MaxIdleConnsPerHost = 64
	// no gzip negotiation of its own either, see Accept-Encoding below
	transport.DisableCompression = true
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != nwbtPrefix && !strings.HasPrefix(r.URL.Path, nwbtPrefix+"/") {
			next.ServeHTTP(w, r)
			return
		}
		state := sidecar.State()
		target, err := url.Parse(state.URL)
		if state.URL == "" || err != nil {
			http.Error(w, "nwbt is not running", http.StatusServiceUnavailable)
			return
		}
		proxy := &httputil.ReverseProxy{
			Transport: transport,
			Rewrite: func(p *httputil.ProxyRequest) {
				p.SetURL(target)
				p.Out.URL.Path = strings.TrimPrefix(p.In.URL.Path, nwbtPrefix)
				p.Out.URL.RawPath = strings.TrimPrefix(p.In.URL.RawPath, nwbtPrefix)
				// the Windows asset server turns a 304 into a 500 (a 304 hangs WebView2): no conditional requests
				p.Out.Header.Del("If-None-Match")
				p.Out.Header.Del("If-Modified-Since")
				// uncompressed: the body stays in process, compressing it only costs time
				p.Out.Header.Del("Accept-Encoding")
			},
		}
		proxy.ServeHTTP(w, r)
	})
}
