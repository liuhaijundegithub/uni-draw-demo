import Base from './Shape';

class Circle extends Base {
  draw () {
    const cvs = document.querySelector(`#${this.id} canvas`)! as HTMLCanvasElement;
    const ctx = cvs.getContext('2d')!;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.beginPath();
    ctx.ellipse(
      this.width / 2 + 10,
      this.height / 2 + 10,
      this.width / 2,
      this.height / 2,
      0, 0,
      2 * Math.PI
    );
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.stroke();
  }
};

export default Circle;
