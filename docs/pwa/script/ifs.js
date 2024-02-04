const createIFS = async function() {
    // IFSの機能を以下のselfに詰め込んで作ることにする。
    const self = {};

    //サンプルのIFS達
    // 半分にする写像一つ。デバッグ用。
    self.ifs1 = [
        {a:0.5, b:0.0, c:0.0, d:0.5,
         e:0.0, f:0.0, p:0.5,
         iro:{r:0.0, g:1.0, b:0.0},
         r: 0.0, s: 0.5}
    ];
    // シルピンスキーのギャスケット。
    self.ifs2 = [
        {a:0.5, b:0.0, c:0.0, d:0.5,
         e:0.0, f:0.3, p:0.5,
         iro:{r:1, g:0, b:0},
         r: 0.0, s: 0.5},
        {a:0.5, b:0.0, c:0.0, d:0.5,
         e:-0.3, f:-0.3, p:0.5,
         iro:{r:0, g:1, b:0},
         r: 0.0, s: 0.5},
        {a:0.5, b:0.0, c:0.0, d:0.5,
         e:0.3, f:-0.3, p:0.5,
         iro:{r:0, g:0, b:1},
         r: 0.0, s: 0.5}
    ];
    // ちょっとシダ植物っぽいやつ
    self.ifs3 = [
        {a:0.5, b:0.0, c:0.0, d:0.5,
         e:-0.3, f:0.0, p:0.5,
         iro:{r:0, g:1, b:0},
         r: 0.0, s: 0.5},
        {a:0.6928, b:-0.34, c:0.34, d:0.6928,
         e:0.0, f:0.3, p:0.5,
         iro:{r:0, g:0, b:1},
         r: 30.0, s: 0.8}
    ];

    self.iteration = 0;
    self.MAX_ITERATION = 25;
    self.MEMORI = 30;
    self.div = document.createElement("div");
    self.div.style.margin = "0px";
    self.div.style.border = "0px";
    self.div.style.padding = "0px";
    self.canvas = document.createElement("canvas");
    self.canvas.style.position = "absolute";
    self.canvas.style.margin = "0px";
    self.canvas.style.border = "0px";
    self.canvas.style.padding = "0px";
    self.div.appendChild(self.canvas);
    self.overlay_canvas = document.createElement("canvas");
    self.overlay_canvas.style.backgroundColor = "#0000";
    self.overlay_canvas.style.position = "absolute";
    self.overlay_canvas.style.margin = "0px";
    self.overlay_canvas.style.border = "0px";
    self.overlay_canvas.style.padding = "0px";
    self.div.appendChild(self.overlay_canvas);
    const ctx = self.overlay_canvas.getContext("2d");
    self.ctx = ctx;
    ctx.fillStyle = "red";
    //ctx.clearRect(0,0,???,???);

    const webgl = new WebGL(self.canvas);
    self.webgl = webgl;
    if (webgl.checkGPGPU() == false) {
        alert("ブラウザが古すぎる！");
        return null;
    }
    const gl = self.webgl.getGL();
    self.gl = gl;
    self.W = 512; // dummy
    self.H = 512; // dummy
    self.scale = 256.0; // dummy
    self.scaleX = 1.0; // dummy
    self.scaleY = 1.0; // dummy
    self.editMode = true;//false;
    self.drawCallbacks = [];
    self.addDrawCallback = function(f) {
        self.drawCallbacks.push(f);
    };
    self.removeDrawCallback = function(f) {
        const i = self.drawCallbacks.indexOf(f);
        self.drawCallbacks.splice(i,1);
    };
    self.funcs = Array.from(self.ifs3);
    self.funcs2 = [];

    // 以下しばらく初期化処理
    // シェーダープログラムを並列で読み込む
    let fs = ['./script/dat.vert','./script/dat.frag',
              './script/ini.vert','./script/ini.frag',
              './script/ifs.vert','./script/ifs.frag',
              './script/prj.vert','./script/prj.frag'];
    let ts = await parallelTextsLoad(fs);
    let dat_vs = ts[0];
    let dat_fs = ts[1];
    let ini_vs = ts[2];
    let ini_fs = ts[3];
    let ifs_vs = ts[4];
    let ifs_fs = ts[5];
    let prj_vs = ts[6];
    let prj_fs = ts[7];

    // 縮小写像の情報を書き込むシェーダ
    self.datPrg = webgl.createProgram(dat_vs,dat_fs);
    // locationの初期化
    self.datAttLocation = [];
    self.datAttLocation[0] = webgl.getAttr(self.datPrg,'data');
    self.datAttStride = [];
    self.datAttStride[0] = 4;
    self.datUniLocation = [];

    // 初期化の計算をするシェーダ
    self.iniPrg = webgl.createProgram(ini_vs,ini_fs);
    // locationの初期化
    self.iniAttLocation = [];
    self.iniAttLocation[0] = webgl.getAttr(self.iniPrg,'position');
    self.iniAttStride = [];
    self.iniAttStride[0] = 3;
    self.iniUniLocation = [];

    // IFSの計算をするシェーダ
    self.ifsPrg = webgl.createProgram(ifs_vs,ifs_fs);
    // locationの初期化
    self.ifsAttLocation = [];
    self.ifsAttLocation[0] = webgl.getAttr(self.ifsPrg,'position');
    self.ifsAttStride = [];
    self.ifsAttStride[0] = 3;
    self.ifsUniLocation = [];
    self.ifsUniLocation[0] = webgl.getUnif(self.ifsPrg,'src');
    self.ifsUniLocation[1] = webgl.getUnif(self.ifsPrg,'funcs');
    self.ifsUniLocation[2] = webgl.getUnif(self.ifsPrg,'num');
    
    // 投影のレンダリングを行うシェーダ
    self.prjPrg = webgl.createProgram(prj_vs,prj_fs);
    // locationの初期化
    self.prjAttLocation = [];
    self.prjAttLocation[0] = webgl.getAttr(self.prjPrg,'position');
    self.prjAttStride = [];
    self.prjAttStride[0] = 3;
    self.prjUniLocation = [];
    self.prjUniLocation[0] = webgl.getUnif(self.prjPrg,'texture');
    self.prjUniLocation[1] = webgl.getUnif(self.prjPrg,'scaleX');
    self.prjUniLocation[2] = webgl.getUnif(self.prjPrg,'scaleY');
    
    // テクスチャの幅と高さ
    //self.TEXTURE_WIDTH  = 2048;
    //self.TEXTURE_HEIGHT = 2048;
    self.TEXTURE_WIDTH  = 1024;
    self.TEXTURE_HEIGHT = 1024;
    
    // 板ポリ
    self.position = [
        -1.0,  1.0,  0.0,
        -1.0, -1.0,  0.0,
         1.0,  1.0,  0.0,
         1.0, -1.0,  0.0
    ];
    let vPlane = webgl.createVBO(self.position);
    self.planeVBOList = [vPlane];

    self.createFDataVBOList = function() {
        // 縮小写像の情報をVBOに変換
        let fData = [];
        for (let i=0;i<self.funcs2.length;i++) {
            fData[12*i+ 0] = self.funcs2[i].a;
            fData[12*i+ 1] = self.funcs2[i].b;
            fData[12*i+ 2] = self.funcs2[i].c;
            fData[12*i+ 3] = 3*i+0;
            fData[12*i+ 4] = self.funcs2[i].d;
            fData[12*i+ 5] = self.funcs2[i].e;
            fData[12*i+ 6] = self.funcs2[i].f;
            fData[12*i+ 7] = 3*i+1;
            fData[12*i+ 8] = self.funcs2[i].iro.r;
            fData[12*i+ 9] = self.funcs2[i].iro.g;
            fData[12*i+10] = self.funcs2[i].iro.b;
            fData[12*i+11] = 3*i+2;
        }
        let fDataVBO = webgl.createVBO(fData);
        self.fDataVBOList = [fDataVBO];
    }

    // フレームバッファの生成
    self.backBuffer  = webgl.createFramebuffer(self.TEXTURE_WIDTH, self.TEXTURE_HEIGHT, gl.FLOAT);
    self.frontBuffer = webgl.createFramebuffer(self.TEXTURE_WIDTH, self.TEXTURE_HEIGHT, gl.FLOAT);
    self.flip = null;
    // 85個分の縮小写像の情報を書き込むフレーム
    // バッファ。ただのテクスチャでいいんだけど
    // 面倒なんで
    self.dataBuffer = webgl.createFramebuffer(16, 16, gl.FLOAT);

// 以下2行必要なのか？
//let ext = gl.getExtension('WEBGL_color_buffer_float');
//gl.renderbufferStorage(gl.RENDERBUFFER, ext.RBGA32F_EXT, self.TEXTURE_WIDTH, self.TEXTURE_HEIGHT);










    self.setWH = function(w,h) {
        self.W = self.canvas.width = w;
        self.H = self.canvas.height = h;
        self.overlay_canvas.width = w;
        self.overlay_canvas.height = h;
        self.div.style.width = w+"px";
        self.div.style.height = h+"px";
        self.overlay_canvas.style.width = w+"px";
        self.overlay_canvas.style.height = h+"px";
        const min = Math.min(w,h);
        self.scale = min / 2;
        self.scaleX = w / min;
        self.scaleY = h / min;
        self.draw();
    };
    //world座標を与えると，最も近いFuncを返してくれる
    self.getNearestFuncWorld = function(x,y) {
        let nearestF = self.funcs[0];
        let min = (nearestF.e - x)*(nearestF.e - x)
            +(nearestF.f - y)*(nearestF.f - y);
        for (let f of self.funcs) {
            const m = (f.e - x)*(f.e - x)
                +(f.f - y)*(f.f - y);
            if (min > m) {
                min = m;
                nearestF = f;
            }
        }
        return nearestF;
    };
    //canvas座標を与えると，最も近いFuncを返してくれる
    self.getNearestFuncCanvas = function(x,y) {
        const xyc = self.canvas2world({'x': x, 'y': y, 'c': "dummy"});
        return self.getNearestFuncWorld(xyc.x,xyc.y);
    }
    //x,y座標をcanvas上の座標に変換してくれる関数
    self.world2canvas = function(xyc) {
        return { 'x': (self.W/2 + self.scale * xyc.x),
                 'y': (self.H/2 - self.scale * xyc.y),
                 'c': xyc.c };
    };
    //canvas上の座標をx,y座標に変換してくれる関数
    self.canvas2world = function(xyc) {
        return { 'x': ((xyc.x - self.W/2)/self.scale),
                 'y': ((self.H/2 - xyc.y)/self.scale),
                 'c': xyc.c };
    };
    self.updateParams = function() {
        //回転と縮小率を行列(a,b,c,d)に変換する
        for (let f of self.funcs) {
            // 以下のthetaの符号が逆な気がするけど・・・
            const theta = -f.r/180*Math.PI;
            const s_cos = f.s * Math.cos(theta);
            const s_sin = f.s * Math.sin(theta);
            f.a =   s_cos;
            f.b = - s_sin;
            f.c =   s_sin;
            f.d =   s_cos;
        }
        self.funcs2 = [];
        // GPGPUで実際に使用する拡大関数に変換
        for (let f1 of self.funcs) {
            let f2 = [];
            let det = f1.a*f1.d - f1.b*f1.c;
            f2.a =  f1.d/det;
            f2.b = -f1.b/det;
            f2.c = -f1.c/det;
            f2.d =  f1.a/det;
            f2.e = f1.e;
            f2.f = f1.f;
            f2.iro = {};
            f2.iro.r = f1.iro.r;
            f2.iro.g = f1.iro.g;
            f2.iro.b = f1.iro.b;
            self.funcs2.push(f2);
        }
        self.createFDataVBOList();
    };

    //このメソッドは再起で何回か呼び出されて短かい
    //アニメーションとして描画を行う
    self.drawIFS = function() {
        //iteration==0の時は，再起の最初の起動
        //なので初期化処理をしてあげる。
        if (self.iteration == 0) {
            self.updateParams();
            // フラグ
            gl.disable(gl.BLEND);
            gl.disable(gl.DEPTH_TEST);

            // 縮小写像の情報をテクスチャに書き込む
            gl.bindFramebuffer(gl.FRAMEBUFFER, self.dataBuffer.f);
            gl.viewport(0,0,16,16);
            gl.clearColor(0.0, 0,0, 0,0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(self.datPrg);
            webgl.setAttribute(self.fDataVBOList, self.datAttLocation, self.datAttStride);
            gl.drawArrays(gl.POINTS, 0, self.funcs2.length*3);

            // デフォルトの頂点情報を書き込む
            gl.bindFramebuffer(gl.FRAMEBUFFER, self.backBuffer.f);
            gl.viewport(0, 0, self.TEXTURE_WIDTH, self.TEXTURE_HEIGHT);
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(self.iniPrg);
            webgl.setAttribute(self.planeVBOList, self.iniAttLocation, self.iniAttStride);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, self.position.length / 3);
//console.log("-------------------");
            let detMax = 0.0;
            for (f of self.funcs) {
                let det = Math.abs(f.a*f.d - f.b*f.c);
                if (det>detMax)
                    detMax = det;
            }
//console.log("detMax: "+detMax);
            let rate = 1.0;
            let i;
            for (i=1;i<=125;i++) {
                rate *= detMax;
                if (rate < 0.00001)
                    break;
            }
            self.MAX_ITERATION = i;
//console.log("self.MAX_ITERATION: "+self.MAX_ITERATION);
        }

        //一セット写像適用して描画
        gl.disable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        //gl.blendFunc(gl.ONE, gl.ONE);
        //gl.blendFunc(gl.ONE, gl.ZERO);

        // フレームバッファをバインド
        gl.bindFramebuffer(gl.FRAMEBUFFER, self.frontBuffer.f);

        // ビューポートを設定
        gl.viewport(0, 0, self.TEXTURE_WIDTH, self.TEXTURE_HEIGHT);

        // フレームバッファを初期化
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // プログラムオブジェクトの選択
        gl.useProgram(self.ifsPrg);

        // テクスチャとしてバックバッファをバインド
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, self.backBuffer.t);
        // ミップマップ生成(効果は不明？)
        //gl.generateMipmap(gl.TEXTURE_2D);

        // テクスチャとして縮小写像情報をバインド
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, self.dataBuffer.t);

        // テクスチャへ頂点情報をレンダリング
        webgl.setAttribute(self.planeVBOList, self.ifsAttLocation, self.ifsAttStride);
        gl.uniform1i(self.ifsUniLocation[0], 0);
        gl.uniform1i(self.ifsUniLocation[1], 1);
        gl.uniform1i(self.ifsUniLocation[2], self.funcs2.length);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, self.position.length / 3);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // フレームバッファをフリップ
        self.flip = self.backBuffer;
        self.backBuffer = self.frontBuffer;
        self.frontBuffer = self.flip;

        gl.disable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        //gl.blendFunc(gl.ONE, gl.ONE);
        //gl.blendFunc(gl.ONE, gl.ZERO);

        // ビューポートを設定
        gl.viewport(0, 0, self.canvas.width, self.canvas.height);

        // フレームバッファのバインドを解除
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // プログラムオブジェクトの選択
        gl.useProgram(self.prjPrg);

        // フレームバッファをテクスチャとしてバインド
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, self.backBuffer.t);

        // 頂点を描画
        webgl.setAttribute(self.planeVBOList, self.prjAttLocation, self.prjAttStride);
        gl.uniform1i(self.prjUniLocation[0], 0);
        gl.uniform1f(self.prjUniLocation[1], self.scaleX);
        gl.uniform1f(self.prjUniLocation[2], self.scaleY);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, self.position.length / 3);

        // コンテキストの再描画
        gl.flush();

        // 2次元の描画
        ctx.clearRect(0,0,self.W,self.H);
        if (self.editMode == true)
            self.drawEditMode();
        for (const f of self.drawCallbacks)
            f();

        // MAX_ITERATIONまで繰り返し
        self.iteration++;
        if (self.iteration < self.MAX_ITERATION) {
            //window.requestAnimationFrame(self.drawIFS);
            if (typeof self.timeoutID === 'number') {
                window.clearTimeout(self.timeoutID);
            }
            self.timeoutID = window.setTimeout(self.drawIFS,33);
        } else {
            self.timeoutID = undefined;
            self.iteration = 0;
        }
    };

    self.drawFunc = function(f) {
        let xy = { 'x': f.e, 'y': f.f, c: "dummy" };
        xy = self.world2canvas(xy);

        //縮小率
        self.ctx.beginPath();
        self.ctx.arc(xy.x,xy.y,self.MEMORI*f.s,0,2*Math.PI,true);
        self.ctx.closePath();
        self.ctx.strokeStyle = 'gray';
        self.ctx.stroke();
        self.ctx.beginPath();

        //確率
        self.ctx.beginPath();
        self.ctx.arc(xy.x,xy.y,self.MEMORI*f.p,0,2*Math.PI,true);
        self.ctx.closePath();
        self.ctx.strokeStyle = 'blue';
        self.ctx.stroke();
        self.ctx.beginPath();

        //回転角表示
        let r = - f.r/180.0 * Math.PI;
        self.ctx.moveTo(xy.x,xy.y);
        self.ctx.arc(xy.x,xy.y,self.MEMORI,r+0.1,r-0.1,true);
        self.ctx.closePath();
        self.ctx.fillStyle = 'red';
        self.ctx.fill();
    };
    self.drawEditMode = function() {
        // まず座標軸を描く
        self.ctx.beginPath();
        self.ctx.moveTo(0,self.H/2);
        self.ctx.lineTo(self.W,self.H/2);
        self.ctx.moveTo(self.W/2,0);
        self.ctx.lineTo(self.W/2,self.H);
        self.ctx.closePath();
        self.ctx.strokeStyle = 'gray';
        self.ctx.stroke();
        for (let f of self.funcs)
            self.drawFunc(f);
    };
    self.draw = function() {
        if (self.iteration > 0) {
            self.iteration = 0;
        } else {
            self.iteration = 0;
            self.drawIFS();
        }
    };

    self.setWH(self.canvas.width,self.canvas.height);
    return self;
}
