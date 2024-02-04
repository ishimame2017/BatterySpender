WebGL = function(canvas) {
    this.gl = canvas.getContext('webgl');
}

WebGL.prototype = {
    getGL: function() {
        return this.gl;
    },

    // シェーダを生成する関数
    checkGPGPU: function() {
        let gl = this.gl;
        // 頂点テクスチャフェッチが利用可能かどうかチェック
        let i = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
        if(i > 0){
            console.log('max_vertex_texture_imaeg_unit: ' + i);
        }else{
            alert('VTF not supported');
            return false;
        }

        // 浮動小数点数テクスチャが利用可能かどうかチェック
        let ext = gl.getExtension('OES_texture_float') || gl.getExtension('OES_texture_half_float');
        if(ext == null){
            alert('float texture not supported');
            return false;
        }
        return true;
    },

    // 
    getAttr: function(prg,name) {
        return this.gl.getAttribLocation(prg,name);
    },

    // 
    getUnif: function(prg,name) {
        return this.gl.getUniformLocation(prg,name);
    },

    // 頂点シェーダを生成する関数
    createVertexShader: function(src){
        let gl = this.gl;
        let shader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(shader,src);
        gl.compileShader(shader);

        // シェーダが正しくコンパイルされたかチェック
        if(gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
            return shader;
        }else{
            alert(gl.getShaderInfoLog(shader));
        }
    },

    // フラグメントシェーダを生成する関数
    createFragmentShader: function(src){
        let gl = this.gl;
        let shader= gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(shader,src);
        gl.compileShader(shader);

        // シェーダが正しくコンパイルされたかチェック
        if(gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
            return shader;
        }else{
            alert(gl.getShaderInfoLog(shader));
        }
    },

    // プログラムオブジェクトを生成しシェーダをリンクする関数
    createProgram: function(vs_src,fs_src){
        let gl = this.gl;
        let vs = this.createVertexShader(vs_src);
        let fs = this.createFragmentShader(fs_src);
        let program = gl.createProgram();
        gl.attachShader(program,vs);
        gl.attachShader(program,fs);
        gl.linkProgram(program);

        // シェーダのリンクが正しく行なわれたかチェック
        if(gl.getProgramParameter(program,gl.LINK_STATUS)){
            gl.useProgram(program);
            return program;
        }else{
            alert(gl.getProgramInfoLog(program));
        }
    },

    // VBOを生成する関数
    createVBO: function(data){
        let gl = this.gl;
        let vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,vbo);
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER,null);
        return vbo;
    },

    // VBOをバインドし登録する関数
    setAttribute: function(vbo,attL,attS){
        let gl = this.gl;
        // 引数として受け取った配列を処理する
        for(let i in vbo){
            // バッファをバインドする
            gl.bindBuffer(gl.ARRAY_BUFFER,vbo[i]);

            // attributeLocationを有効にする
            gl.enableVertexAttribArray(attL[i]);

            // attributeLocationを通知し登録する
            gl.vertexAttribPointer(attL[i],attS[i],gl.FLOAT,false,0,0);
        }
    },

    // フレームバッファをオブジェクトとして生成する関数
    createFramebuffer: function(width,height,format){
        let gl = this.gl;

        let textureFormat = null;
        if(!format){
            textureFormat = gl.UNSIGNED_BYTE;
        }else{
            textureFormat = format;
        }

        let frameBuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER,frameBuffer);

        let fTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D,fTexture);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,width,height,0,gl.RGBA,textureFormat,null);

        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);

        gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,fTexture,0);

        gl.bindTexture(gl.TEXTURE_2D,null);
        gl.bindRenderbuffer(gl.RENDERBUFFER,null);
        gl.bindFramebuffer(gl.FRAMEBUFFER,null);

        return {f : frameBuffer, t : fTexture};
    }
};

//ファイルを読み込む非同期関数
const myGet = async function(url) {
  return new Promise(function(resolve,reject) {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        if (xhr.status == 200)
          resolve(xhr.responseText);
        else
          reject(xhr.statusText);
      }
    };
    xhr.open("GET",url);
    xhr.send();
  });
};

async function parallelTextsLoad(files) {
    let ps = [];
    for (let i in files)
        ps.push(myGet(files[i]));
    let ret = [];
    await Promise.all(ps).then(values => {
        for (let i in values) {
            ret.push(values[i]);
        }
    });
    return ret;
}
