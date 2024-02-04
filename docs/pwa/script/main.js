let ifs = null; // IFS!
let modalWindow = null; // モーダルウィンドウ
let f1 = null; // 1本目の指の情報
let f2 = null; // 2本目の指の情報
let f1time = 0; // 1本目の指が触れた瞬間の時間
let preDir = 0; // 前回角度
let preDis = 1; // 前回距離
let func = null; // 現在操作中の縮小写像
let mode = "閲覧"; // モード("閲覧"，"編集"，"色"，"確率")

// このページの初期化の処理をします。
const init = async function() {
    ifs = await createIFS();
    document.body.appendChild(ifs.div);
    ifs.MAX_ITERATION = ifs.iteration = 100000;
    ifs.editMode = false;
    ifs.div.addEventListener("touchstart", handleStart);
    ifs.div.addEventListener("touchmove", handleMove);
    ifs.div.addEventListener("touchend", handleEnd);
    ifs.div.addEventListener("touchcancel", handleCancel);
    ifs.div.addEventListener("mousedown",
        (e)=>{newFinger({id:"mouse",x:e.pageX,y:e.pageY});});
    ifs.div.addEventListener("mousemove",
        (e)=>{updateFinger({id:"mouse",x:e.pageX,y:e.pageY});});
    ifs.div.addEventListener("mouseup",
        (e)=>{removeFinger({id:"mouse",x:e.pageX,y:e.pageY});});
    ifs.setWH(document.body.clientWidth,document.body.clientHeight);
    ifs.addDrawCallback(()=>{
        if (mode!=="閲覧") {
            ifs.ctx.fillStyle = "gray";
            ifs.ctx.fillRect(0,0,30,30);
            ifs.ctx.strokeStyle = "black";
            ifs.ctx.lineWidth = 5;
            ifs.ctx.beginPath();
            ifs.ctx.moveTo(5,8);
            ifs.ctx.lineTo(25,8);
            ifs.ctx.moveTo(5,15);
            ifs.ctx.lineTo(25,15);
            ifs.ctx.moveTo(5,22);
            ifs.ctx.lineTo(25,22);
            ifs.ctx.closePath();
            ifs.ctx.stroke();
            ifs.ctx.lineWidth = 1;
            ifs.ctx.fillStyle = "orange";
            ifs.ctx.font = "normal 20px sans-serif";
            ifs.ctx.fillText(mode+"モード",50,30);
        }
    });
    modalWindow = document.querySelector("#modal");
};
window.addEventListener("load",init);
// ページ読み込み完了イベントでinit()を実行

//タッチした瞬間に呼ばれる関数
function handleStart(e) {
    e.preventDefault();
    for (let i=0;i<e.changedTouches.length;i++) {
        const t = e.changedTouches[i];
        newFinger({id:t.identifier, x:t.pageX, y:t.pageY});
    }
}

//タッチした指が動いた時に呼ばれる関数
function handleMove(e) {
    e.preventDefault();
    for (let i=0;i<e.changedTouches.length;i++) {
        const t = e.changedTouches[i];
        updateFinger({id:t.identifier, x:t.pageX, y:t.pageY});
    }
}

//タッチした指が離された時に呼ばれる関数
function handleEnd(e) {
    e.preventDefault();
    for (let i=0;i<e.changedTouches.length;i++) {
        const t = e.changedTouches[i];
        removeFinger({id:t.identifier, x:t.pageX, y:t.pageY});
    }
}

//タッチがキャンセルされた時に呼ばれる関数
function handleCancel(e) {
  handleEnd(e); // handleEnd()と同じ処理をさせる
}

// タッチオブジェクトの情報を受け取り
// 最大2本分の指の情報を保存する関数
function newFinger(p) {
    // f1が空(null)ならf1にpを入れ
    // f2が空(null)ならf2にpを入れる
    const pp = ifs.canvas2world({x:p.x,y:p.y,c:1});
    if (f1==null) {
        f1 = p;
        f1time = new Date().getTime();
        const tf = ifs.getNearestFuncCanvas(p.x,p.y);
        const ss = ifs.MEMORI/ifs.scale;
        if (((pp.x-tf.e)*(pp.x-tf.e)+(pp.y-tf.f)*(pp.y-tf.f))<(ss*ss)) {
            func = tf;
        } else {
            func = null;
        }
    } else if (f2==null) {
        f2 = p;
        //ここに来たということはf1はある
        preDis = Math.sqrt((f2.x-f1.x)*(f2.x-f1.x)+(f2.y-f1.y)*(f2.y-f1.y));
        preDir = Math.acos((f2.x-f1.x)/preDis)*180/Math.PI;
        if (f2.y-f1.y > 0.0)
          preDir *= -1;
    }
}

// タッチした指が動いた時に，どの指が動いたのか
// 判定した上でf1かf2の座標の情報を更新する．関数
function updateFinger(p) {
  if (f1!=null && f1.id===p.id) {
      f1 = p;
      const pp = ifs.canvas2world({x:p.x,y:p.y,c:1});
      if (mode==="編集" && func!=null) {
          func.e = pp.x;
          func.f = pp.y;
          ifs.draw();
      }
  } else if (f2!=null && f2.id===p.id) {
      f2 = p;
      if (mode==="編集" && f1!=null && func!=null) {
          const nowDis = Math.sqrt((f2.x-f1.x)*(f2.x-f1.x)+(f2.y-f1.y)*(f2.y-f1.y));
          let nowDir = Math.acos((f2.x-f1.x)/nowDis)*180/Math.PI;
          if (f2.y-f1.y > 0.0)
              nowDir *= -1;
          func.s *= (nowDis/preDis);
          if (func.s > 0.9)
              func.s = 0.9;
          func.r += (nowDir-preDir);
          preDis = nowDis;
          preDir = nowDir;
          ifs.draw();
      }
  }
}

// タッチが終了して指が離れた時は対応する
// f1かf2をnullにする関数。また，タップされた
// かどうか判定して，タップ処理を呼び出す。
function removeFinger(p) {
    if (f1!=null && f1.id===p.id) {
        // tfは指が離れた瞬間に近くにあった縮小写像
        let tf = ifs.getNearestFuncCanvas(p.x,p.y);
        // でも一番近いやつでも離れてたら tf=null;
        const ss = ifs.MEMORI/ifs.scale;
        const pp = ifs.canvas2world({x:f1.x,y:f1.y,c:1});
        if (((pp.x-tf.e)*(pp.x-tf.e)+(pp.y-tf.f)*(pp.y-tf.f))>(ss*ss)) {
            tf = null
        }
        // 以下のifはチョンとタップした場合の処理
        // (押してから話すまで0.3秒以下)
        if ((new Date().getTime() - f1time)<300 && func===tf) {
            tapped(f1.x,f1.y);
        }
        // 必須処理(チョンとタップしてない場合もやる)
        f1 = null;
        func = null;
    } else if (f2!=null && f2.id===p.id) {
        f2 = null;
    }
}

// タップされたら呼び出される関数
// モードごとに別関数を呼び出す。
function tapped(x,y) {
    if (mode==="閲覧") tappedView(x,y);
    else if (mode==="編集") tappedEdit(x,y);
    else if (mode==="色") tappedColor(x,y);
    else if (mode==="確率") tappedProb(x,y);
    else alert("???不明なモードでタップ???");
}

// 閲覧モード時のタップ処理
function tappedView(x,y) {
    ifs.editMode = true;
    ifs.draw();
    mode = "編集";
}

// 編集モード時のタップ処理
function tappedEdit(x,y) {
    if (x<=30 && y<=30) {
        document.querySelector("#modal").style.display = "block";
        return;
    }
    if (func!=null) { // 既存funcをタップ
        if (ifs.funcs.length>2) {
            const i = ifs.funcs.indexOf(func);
            ifs.funcs.splice(i,1);
            ifs.draw();
        }
    } else { // 空間をタップ
        const pp = ifs.canvas2world({'x':x,'y':y,c:1});
        const color = {r: Math.random(), g: Math.random(), b: Math.random() };
        const newFunc = {'a':0.5,'b':0,'c':0,'d':0.5,'e':pp.x,'f':pp.y, 'p':0.3, 'iro': color, 'r':0, 's': 0.5 };
        ifs.funcs.push(newFunc);
        ifs.draw();
    }
}

// 色モード時のタップ処理
function tappedColor(x,y) {
    if (x<=30 && y<=30) {
        document.querySelector("#modal").style.display = "block";
        return;
    }
    if (func!=null) {
        func.iro = {r:Math.random(),g:Math.random(),b:Math.random()};
        ifs.draw();
    }
}

// 確率モード時のタップ処理
function tappedProb(x,y) {
    if (x<=30 && y<=30) {
        document.querySelector("#modal").style.display = "block";
        return;
    }
    if (func!=null) {
        func.p *= 1.5;
        ifs.draw();
    }
}

//閲覧モードへの切り替え
function viewMode() {
    document.querySelector("#modal").style.display = "none";
    mode = "閲覧";
    ifs.editMode = false;
    ifs.draw();
}

//編集モードへの切り替え
function editMode() {
    document.querySelector("#modal").style.display = "none";
    mode = "編集";
    ifs.draw();
}

//色モードへの切り替え
function colorMode() {
    document.querySelector("#modal").style.display = "none";
    mode = "色";
    ifs.draw();
}

//確率モードへの切り替え
function probMode() {
    document.querySelector("#modal").style.display = "none";
    mode = "確率";
    ifs.draw();
}

//モーダルウィンドウを閉じる。
function closeModal() {
    document.querySelector("#modal").style.display = "none";
}
