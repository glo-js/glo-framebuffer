var torus = require('primitive-torus')()
var demo = require('glo-demo-primitive')(torus, {
  repeat: [8, 4],
  texture: true,
  color: [0, 1, 0, 1],
  angle: Math.PI / 1.1
})

var gl = demo.gl
// var fbo = require('gl-fbo')(gl, [gl.drawingBufferWidth, gl.drawingBufferHeight])

var Framebuffer = require('../lib/Framebuffer')
var fbo = new Framebuffer(gl, [gl.drawingBufferWidth, gl.drawingBufferHeight])
var drawQuad = require('./glo-draw-quad')(gl)

demo.removeAllListeners('tick')
demo.on('tick', draw)
// demo.start()
draw()

function draw (dt) {
  fbo.bind()
  gl.clearColor(0, 0, 0, 1)
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  demo.render(dt)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.disable(gl.CULL_FACE)

  gl.clearColor(0, 0, 1, 1)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
  fbo.color[0].bind()
  drawQuad()
}

// / "draw stack" idea
// / vulkan type of thing
// / execute draw commands
// / maintains state to reduce buffer binds
// / things will plug into that command queue
