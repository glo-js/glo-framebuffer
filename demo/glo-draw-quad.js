var glslify = require('glslify')

var vert = glslify('./quad.vert')
var frag = glslify('./quad.frag')
var quad = require('primitive-quad')()
var createMesh = require('glo-mesh')
var createShader = require('glo-shader')
module.exports = screenAlignedQuad

function screenAlignedQuad (gl) {
  var mesh = createMesh(gl, quad)
    .attribute('position', quad.positions)
    .attribute('uv', quad.uvs)
    .elements(quad.cells)

  var shader = createShader(gl, { vertex: vert, fragment: frag })

  function draw () {
    shader.bind()
    mesh.bind(shader)
    mesh.draw(gl.TRIANGLES)
    mesh.unbind(shader)
  }

  return {
    shader: shader,
    draw: draw
  }
}