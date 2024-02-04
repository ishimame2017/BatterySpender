attribute vec4 data;
varying vec4 color;
void main(){
    color = vec4(data.x,data.y,data.z,1.0);
    float x = (mod(data.w, 16.0) - 7.5) / 8.0;
    float y = (floor(data.w / 16.0) -7.5) / 8.0;
    gl_Position = vec4(x, y, 0.0, 1.0);
}
