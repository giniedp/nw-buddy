package gltf

import (
	"nw-buddy/tools/utils"
	"os"
	"path"
	"path/filepath"
	"strings"
	"sync"
)

type ResourceLinker interface {
	// The directory where the resources are stored
	OutputDirectory() string
	// Set the directory where the resources are stored
	SetOutputDirectory(dir string)
	// Whether to use relative URIs
	RelativeMode() bool
	// Set whether to use relative URIs
	SetRelativeMode(relative bool)
	// Read a file from the output directory
	Read(uri string) ([]byte, error)
	// Write a file to the output directory
	Write(uri string, data []byte) error
	// Converts an URI that is relative to given assetPath to be relative to output directory.
	ToOutputURI(assetPath string, relativeUri string) string
	// Converts an URI that is relative to output directory to be relative to given assetPath.
	ToAssetURI(assetPath string, absoluteUri string) string
	// Reads a linked resource from output directory.
	// Converts URI depending on relative mode.
	ReadLinkedResource(assetPath string, uri string) ([]byte, error)
	// Writes a linked resource.
	// Converts URI depending on relative mode.
	// Returns the URI that should be stored in the asset.
	WriteLinkedResource(assetPath string, uri string, data []byte) (string, error)
}

func NewResourceLinker(dir string) ResourceLinker {
	return &resourceLinker{
		dir:      dir,
		relative: true,
		mu:       &sync.Mutex{},
	}
}

type resourceLinker struct {
	dir      string
	relative bool
	mu       *sync.Mutex
}

func (r *resourceLinker) OutputDirectory() string {
	return r.dir
}

func (r *resourceLinker) SetOutputDirectory(dir string) {
	r.dir = dir
}

func (r *resourceLinker) RelativeMode() bool {
	return r.relative
}

func (r *resourceLinker) SetRelativeMode(relative bool) {
	r.relative = relative
}

func (r *resourceLinker) ToOutputURI(resource string, relativeUri string) string {
	if relativeUri == "" {
		return ""
	}
	if path.Ext(resource) != "" {
		resource = path.Dir(resource)
	}
	absoluteUri := path.Join(resource, relativeUri)
	result, _ := filepath.Rel(r.dir, absoluteUri)
	result = strings.ReplaceAll(result, "\\", "/")
	return result
}

func (r *resourceLinker) ToAssetURI(resource string, absoluteUri string) string {
	if absoluteUri == "" {
		return ""
	}
	if path.Ext(resource) != "" {
		resource = path.Dir(resource)
	}
	absoluteUri = path.Join(r.dir, absoluteUri)
	result, _ := filepath.Rel(resource, absoluteUri)
	result = strings.ReplaceAll(result, "\\", "/")
	return result
}

func (r *resourceLinker) ReadLinkedResource(assetPath string, uri string) ([]byte, error) {
	if r.relative {
		uri = r.ToOutputURI(assetPath, uri)
	}
	return r.Read(uri)
}

func (r *resourceLinker) WriteLinkedResource(assetPath string, uri string, data []byte) (string, error) {
	if r.relative {
		uri = r.ToAssetURI(assetPath, uri)
	}
	uri = strings.ToLower(uri)
	return uri, r.Write(uri, data)
}

func (r *resourceLinker) Read(file string) ([]byte, error) {
	if file == "" {
		return nil, nil
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	return os.ReadFile(path.Join(r.dir, file))
}

func (r *resourceLinker) Write(file string, data []byte) error {
	if file == "" {
		return nil
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	return utils.WriteFile(path.Join(r.dir, file), data)
}
