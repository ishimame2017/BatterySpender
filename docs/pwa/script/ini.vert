attribute vec3 position;
varying vec2 loc;
void main(){
    loc = vec2(0.5*position.x+0.5,0.5*position.y+0.5);
    gl_Position = vec4(position, 1.0);
}
