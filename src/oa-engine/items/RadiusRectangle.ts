import Shape from '../items/Shape';

class RadiusReatangle extends Shape {
  draw () {
    // 实现圆角矩形绘制逻辑
    const cvs = document.querySelector(`#${this.id} canvas`)! as HTMLCanvasElement;
    const ctx = cvs.getContext('2d')!;
    ctx.clearRect(0, 0, this.width, this.height);
    function drawRoundedRectangle(x: number, y: number, width: number, height: number, radius: number) {
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + width, y, x + width, y + height, radius);
      ctx.arcTo(x + width, y + height, x, y + height, radius);
      ctx.arcTo(x, y + height, x, y, radius);
      ctx.arcTo(x, y, x + width, y, radius);
      ctx.closePath();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.fill();
    }

    drawRoundedRectangle(10, 10, this.width, this.height, Math.min(this.height, this.width) / 2);
  }
};

export default RadiusReatangle;
