/**---------------------------------------------------------------------------
 * The Rectangle object for abbreviation of PIXI's one
 * @class Rect
 */
class Rect{
  /**
   * @constructor
   * @param {Object} rect - initialize by the object that contain rect data
   * @param {...Number} [params] - initialize by given x, y, w, h
   * @param {Number} x - The X point of the bitmap
   * @param {Number} y - The Y point of the bitmap
   * @param {Number} width - The width of the bitmap
   * @param {Number} height - The height of the bitmap
   */
  constructor(...args){
    let arglen = validArgCount.apply(window, args);
    if(arglen == 1){
      this.x = args[0].x;
      this.y = args[0].y;
      this.width = args[0].width;
      this.height = args[0].height;
    }
    else if(arglen == 4){
      this.x = args[0];
      this.y = args[1];
      this.width = args[2];
      this.height = args[3];
    }
  }
  /**
   * Check whether given point in the rect
   * @param {Integer} x 
   * @param {Integer} y 
   */
  contains(x, y){
    return this.x <= x && x <= this.x+this.width && this.y <= y && y <= this.y+this.height
  }
}

/**
 * Drawable object of WebGL
 * @class Drawable
 * @member {Object} tickHandler Update methods called in each update/tick
 * @member {Drawable} parent Parent node
 * @member {Array<Drawable*>} children Children nodes
 * @member {mat4} world_matrix World system model matrix
 */
class Drawable{
  /**
   * @param {mat4} vmatrix View matrix
   * @param {mat4} mmatrix Local/Model matrix
   * @param {mat4} pmatrix Projection matrix
   * @param {Array} vbuffer Vertices buffer
   * @param {Array} cbuffer Color buffer
   * @param {Array} ibuffer Index buffer
   * @param {Integer} text_id Texure id
   * @param {Integer} type Object type id
   */
  constructor(vmatrix, mmatrix, pmatrix, vbuffer, cbuffer, ibuffer, method, type, text_id=null){
    this.view_matrix = vmatrix;
    this.model_matrix = mmatrix;
    this.projection_matrix = pmatrix;
    this.vertex_buffer = vbuffer;
    this.color_buffer = cbuffer;
    this.index_buffer = ibuffer;
    this.method = method;
    this.type = type;
    this.tickHandler = {};
    if(!text_id){text_id = 0;}
    this.texture_id = text_id;
    this.rotation = [0, 0, 0];
    this.world_rotation = [0,0,0];
    this._static = false;
    this.parent   = null;
    this.children = [];
    this.world_matrix = identityMatrix(4);
  }
  /**
   * > Free the buffer, should not be drawn again after this method called
   */
  dispose(){
    GL.deleteBuffer(this.vertex_buffer);
    GL.deleteBuffer(this.color_buffer);
    GL.deleteBuffer(this.index_buffer);
  }
  /**
   * > Rotate object
   * @param {vec3} anchor Rotation anchor
   * @param {vec3} scale  Rotation scaler vector of xyz
   * @param {float} scale_mul Multiplier of the scaler vector
   */
  rotate(anchor, scale, scale_mul=1.0){
    let rx = deg2rad(scale[0] * scale_mul);
    let ry = deg2rad(scale[1] * scale_mul);
    let rz = deg2rad(scale[2] * scale_mul);
    
    this.rotation[0] += deg2rad(scale[0] * scale_mul);
    this.rotation[1] += deg2rad(scale[1] * scale_mul);
    this.rotation[2] += deg2rad(scale[2] * scale_mul);
    this.rotation[0] %= ROUND_RAD;
    this.rotation[1] %= ROUND_RAD;
    this.rotation[2] %= ROUND_RAD;

    mat4.rotateX(this.model_matrix, rx, anchor[0]);
    mat4.rotateY(this.model_matrix, ry, anchor[1]);
    mat4.rotateZ(this.model_matrix, rz, anchor[2]);
    // let rmat = identityMatrix(4);
    // mat4.rotate(rmat, rx, [0, 1, 0]);
    // mat4.rotate(rmat, ry, [1, 0, 0]);
    // mat4.rotate(rmat, rz, [0, 0, 1]);
    // mat4.rotate(rmat, rx, [anchor[0], 1, anchor[2]]);
    // mat4.rotate(rmat, ry, [1, anchor[1], anchor[2]]);
    // mat4.rotate(rmat, rz, [anchor[0], anchor[1], 1]);
    // mat4.multiply(rmat, this.model_matrix, this.model_matrix);
  }
  /**
   * > Equivalent to `rotate(...)` but rotates whole system/subtree
   */
  globalRotate(anchor, scale, scale_mul=1.0){
    if(!!this._locked){return ;}
    this._locked = true;
    let rx = deg2rad(scale[0] * scale_mul);
    let ry = deg2rad(scale[1] * scale_mul);
    let rz = deg2rad(scale[2] * scale_mul);
    this.world_rotation[0] += rx; this.world_rotation[0] %= ROUND_RAD;
    this.world_rotation[1] += ry; this.world_rotation[0] %= ROUND_RAD;
    this.world_rotation[2] += rz; this.world_rotation[0] %= ROUND_RAD;

    mat4.rotateX(this.world_matrix, rx, anchor[0]);
    mat4.rotateY(this.world_matrix, ry, anchor[1]);
    mat4.rotateZ(this.world_matrix, rz, anchor[2]);
    
    let stack = [this];
    while(stack.length > 0){
      let node = stack.pop();
      for(let i=0;i<node.children.length;++i){
        node.children[i].world_matrix = matcpy(this.world_matrix);
        node.children[i].world_rotation = clone(this.world_rotation);
        if(node.children[i].children.length > 0){
          stack.push(node.children[i]);
        }
      }
    }
    this._locked = false;
  }
  /**
   * > Mobe object
   * @param {Float} dx Delta X - (Left <=> Right) +
   * @param {Float} dy Delta Y - (Down <=> Up) +
   * @param {Float} dz Delta Z - (back <=> front) +
   * @param {float} scale_mul Multiplier of the scaler vector
   */
  move(dx, dy, dz, scale_mul=1.0){
    dx *= scale_mul;
    dy *= scale_mul;
    dz *= scale_mul;

    mat4.translate(this.view_matrix, [dx, dy, dz]);
  }
  /**
   * > Update object
   * @param {Integer} dt Milisecond lapsed since last update
   * @param {Boolean} update_children Update children
   */
  update(dt, update_children=true, _refresh=true){
    for(let i in this.tickHandler){
      if(this.tickHandler.hasOwnProperty(i) && this.tickHandler[i]){
        this.tickHandler[i](dt);
      }
    }
    if(update_children){
      this.children.forEach((child)=>{ child.update(dt, true, false); });
    }
    if(_refresh){
      this.refresh(update_children);
    }
  }
  /**
   * > Refresh (draw) object
   */
  refresh(update_children=true){
    let vmat = TopMatrix("view");
    let pmat = TopMatrix("projection");
    
    if(!vmat){ vmat = identityMatrix(4);}
    else{ vmat = matcpy(vmat); }
    if(!pmat){ pmat = this.projection_matrix; }
    else{ pmat = matcpy(pmat); }

    let wmat = matcpy(this.world_matrix);
    let mmat = matcpy(this.model_matrix);
    
    mat4.multiply(vmat, this.view_matrix);

    if(!this.static && this.parent){
      let rx = this.posX;
      let ry = this.posY;
      let rz = -this.posZ;
      let rr = Math.sqrt(rx*rx+ry*ry+rz*rz)
      
      let theta = Math.atan2(rz, rx) + deg2rad(90);
      let phi   = Math.acos(ry/rr);
      let omega = Math.atan2(ry, rz);
      if(rz == 0){omega = 0;} // z-axis is always negative

      let x1 = rr * Math.sin(theta) * Math.sin(phi);
      let y1 = rr * Math.cos(phi);
      let z1 = rr * Math.cos(theta) * Math.sin(phi);
      x1 = decimal(x1); y1 = decimal(y1); z1 = decimal(z1);
      
      let x2 = rr * Math.sin(theta+this.world_rotation[1]) * Math.sin(phi+this.world_rotation[2]);
      let y2 = rr * Math.cos(phi+this.world_rotation[2]);
      let z2 = rr * Math.cos(theta+this.world_rotation[1]) * Math.sin(phi);
      
      let yz2 = rotate2D(y2, z2, this.world_rotation[0]);
      y2 = yz2[0]; z2 = yz2[1];

      x2 = decimal(x2);  y2 = decimal(y2);  z2 = decimal(z2);
      vmat[12] += x2 - x1;
      vmat[13] += y2 - y1;
      vmat[14] += z2 - z1;
      mat4.multiply(wmat, mmat, mmat);
      // if(Input.isTriggered(Input.keymap.kQ)){
      //   console.log("---------");
      //   console.log("pos: ", [x1,y1,z1], [x2,y2,z2]);
      //   console.log("theta: ", rad2deg(theta), rad2deg(theta+this.world_rotation[1]));
      //   console.log("phi: ", rad2deg(phi), rad2deg(phi+this.world_rotation[2]));
      //   console.log("omega: ", rad2deg(omega), rad2deg(omega+this.world_rotation[0]));
      //   console.log("wmat: ", wmat);
      //   console.log("vmat: ", vmat);
      // }
    }

    PushMatrix("projection", matcpy(pmat));
    PushMatrix("model", matcpy(mmat));
    PushMatrix("view", matcpy(vmat));

    this._realX = vmat[12];
    this._realY = vmat[13];
    this._realZ = vmat[14];
    if(this.static){
      let theta = this.world_rotation[1] + this.rotation[1];
      let phi   = this.world_rotation[2] + this.rotation[2];
      let omega = this.world_rotation[0] + this.rotation[0];
      if(Input.isTriggered(Input.keymap.kQ)){
        console.log("---- static -----");
        console.log(rad2deg(theta), rad2deg(phi), rad2deg(omega))
      }
      mat4.rotateX(mmat, omega, 0);
      mat4.rotateY(mmat, theta, 0);
      mat4.rotateZ(mmat, phi, 0);
    }

    PushMatrix("model", mmat);
    PushMatrix("view", vmat);

    if(this.type == OBJTYPE_2D){
      drawBuffer(this.vertex_buffer, this.color_buffer, this.method)
    }
    else if(this.type == OBJTYPE_3D){
      drawBuffer3D(this.vertex_buffer, this.color_buffer, this.index_buffer, this.method);
    }

    PopMatrix("view");
    PopMatrix("model");

    if(update_children){
      for(let i=0;i<this.children.length;++i){
        this.children[i].refresh(true);
      }
    }

    PopMatrix("view");
    PopMatrix("model");
    PopMatrix("projection");
  }
  /**
   * > The given function to be called during each frame tick/update
   * @param {Function} handler The funciton to be called
   * @param {String} symbol (Optional)Tracking symbol of the handler, index is used if not given
   * @returns {String} Tracking symbol of the handler
   */
  registerTickHandler(handler, symbol=null){
    if(!symbol){
      symbol = getObjKeySize(this.tickHandler) + 1;
    }
    this.tickHandler[symbol] = handler
    return symbol;
  }

  /**
  * > Removes the handler from the  frame loop
  * @param {String} symbol 
  */
  removeTickHandler(symbol){
    this.tickHandler[symbol] = undefined;
  }

  /**
   * Static object flag setter/getter
   */
  get static(){ return this._static; }
  set static(b){ this._static = b; }

  get posX(){return this.view_matrix[12];}
  get posY(){return this.view_matrix[13];}
  get posZ(){return this.view_matrix[14];}
  
  get realX(){ return this._realX; }
  get realY(){ return this._realY; }
  get realZ(){ return this._realZ; }

  /**
   * > Add child to group
   * @param {Drawable} obj Child drawable object 
   */
  appendChild(obj){
    this.children.push(obj);
    obj.parent = this;
  }
  /**
   * > Remove drawable from children group
   * @param {Drawable} obj 
   */
  removeChild(obj){
    this.children.splice(this.children.indexOf(obj), 1);
    obj.parent = null;
  }
}