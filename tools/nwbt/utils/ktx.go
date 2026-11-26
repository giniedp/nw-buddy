package utils

import (
	"bytes"
	"fmt"
	"os/exec"
	"runtime"
	"strings"
)

type ktx struct{ command string }

var Ktx = ktx{"ktx"}

// ktxThreads is the --threads of one `ktx create`. Its PNG decode, mips and zstd run on one thread, only the block
// encoding uses more: a few images at once with 2 threads each give the best throughput.
const ktxThreads = 2

// ktxSlots bounds the `ktx create` processes that run at once, process wide
var ktxSlots = make(chan struct{}, max(runtime.NumCPU()/ktxThreads, 1))

func (it ktx) Name() string {
	return it.command
}

func (it ktx) Check() (string, bool) {
	p, err := exec.LookPath(it.command)
	if err != nil {
		return p, false
	}
	return p, true
}

func (it ktx) Info() string {
	return "Create, validate and transcode KTX texture files (KTX2 textures)\n" +
		"docs:     https://github.com/KhronosGroup/KTX-Software\n" +
		"download: https://github.com/KhronosGroup/KTX-Software/releases"
}

// KtxCreateOpt describes the KTX2 file `ktx create` writes from an image
type KtxCreateOpt struct {
	// Format is the Vulkan format of the texture data, e.g. R8G8B8A8_SRGB, R8G8B8A8_UNORM, R8G8B8_UNORM, R8_UNORM.
	// `ktx create` converts the channels of the input. An _SRGB format gets the sRGB transfer function.
	Format string
	// NormalMap normalizes the normals of the generated mips
	NormalMap bool
}

// Create encodes png bytes to a KTX2 file: UASTC (quality 2) with zstd supercompression and generated mips, the
// transfer function follows the format. The data goes through stdin / stdout.
func (it ktx) Create(png []byte, opt KtxCreateOpt) ([]byte, error) {
	oetf := "linear"
	primaries := "none"
	if strings.HasSuffix(opt.Format, "_SRGB") {
		oetf = "srgb"
		primaries = "bt709"
	}
	args := []string{
		"create",
		"--threads", fmt.Sprint(ktxThreads),
		"--generate-mipmap",
		"--encode", "uastc",
		"--uastc-quality", "2",
		"--zstd", "18",
		"--assign-oetf", oetf,
		"--assign-primaries", primaries,
		"--format", opt.Format,
	}
	if opt.NormalMap {
		args = append(args, "--normalize")
	}
	args = append(args, "--stdin", "--stdout")

	ktxSlots <- struct{}{}
	defer func() {
		<-ktxSlots
	}()
	cmd := exec.Command(it.command, args...)
	cmd.Stdin = bytes.NewReader(png)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("%s create: %w: %s", it.command, err, strings.TrimSpace(stderr.String()))
	}
	return stdout.Bytes(), nil
}
