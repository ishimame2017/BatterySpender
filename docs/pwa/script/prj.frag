precision mediump float;
varying vec2 loc;
uniform sampler2D texture;
uniform float scaleX;
uniform float scaleY;

/*---- convert plane-to-texture -------*/
const float texscale = 1.0;
float T(float x) { // plane to texture
  x*=texscale;
  return x/sqrt(1.0+x*x)*0.5+0.5;
}
vec2 T(vec2 p) { return vec2(T(p.x),T(p.y)); }

void main() {
    vec2 loc2 = vec2(loc.x - 0.5, loc.y - 0.5);
    loc2 = loc2 * 2.0;
    loc2.x *= scaleX;
    loc2.y *= scaleY;
    loc2 = T(loc2);
    gl_FragColor = texture2D(texture,loc2);
}
