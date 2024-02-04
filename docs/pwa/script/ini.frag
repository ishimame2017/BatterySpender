precision mediump float;
varying vec2 loc;
void main(){
    if (loc.x>0.15 && loc.x<0.85 && loc.y>0.15 && loc.y<0.85)
        gl_FragColor = vec4(1,1,1,1);
    else
        gl_FragColor = vec4(0,0,0,1);
}
