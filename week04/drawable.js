class Drawable{
  /**
   * @param {Array} vpmatrix Viewport matrix
   * @param {Array} vbuffer Vertices buffer
   * @param {Array} cbuffer Color buffer
   * @param {Integer} text_id Texure id
   */
  constructor(vpmatrix, vbuffer, cbuffer, method, text_id=null){
    this.viewport_matrix = vpmatrix;
    this.vertex_buffer = vbuffer;
    this.color_buffer = cbuffer;
    this.method = method;
    if(!text_id){text_id = 0;}
    this.texture_id = text_id;
    this.rotation = [0, 0, 0];
  }
  /**
   * > Free the buffer, should not be drawn again after this method called
   */
  dispose(){
    GL.deleteBuffer(this.vertex_buffer);
    GL.deleteBuffer(this.color_buffer);
  }
  /**
   * 
   * @param {vec3} anchor Rotation anchor
   * @param {vec3} scale  Rotation scaler vector of xyz
   * @param {float} scale_mul Multiplier of the scaler vector
   */
  rotate(anchor, scale, scale_mul=1.0){
    let vmat = mat4.create();
    let mmat = mat4.create();
    mat4.identity(vmat);
    mat4.translate(vmat, this.viewport_matrix);
    mat4.identity(mmat);
    
    this.rotation[0] += deg2rad(scale[0] * scale_mul);
    this.rotation[1] += deg2rad(scale[1] * scale_mul);
    this.rotation[2] += deg2rad(scale[2] * scale_mul);
    this.rotation[0] %= ROUND_RAD;
    this.rotation[0] %= ROUND_RAD;
    this.rotation[0] %= ROUND_RAD;

    mat4.rotateX(mmat, this.rotation[0], anchor[0]);
    mat4.rotateY(mmat, this.rotation[1], anchor[1]);
    mat4.rotateZ(mmat, this.rotation[2], anchor[2]);

    GL.uniform1f(shaderProgram.textureID, this.texture_id);
    PushMatrix("model", mmat);
    PushMatrix("view", vmat);
    drawBuffer(this.vertex_buffer, this.color_buffer, this.method);
    PopMatrix("model");
    PopMatrix("view");
  }
}