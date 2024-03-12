import Shape from './Shape';

class Rhombus extends Shape {
  draw () {
    const cvs = document.querySelector(`#${this.id} canvas`)! as HTMLCanvasElement;
    const ctx = cvs.getContext('2d')!;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.beginPath();
    ctx.moveTo(10, this.height / 2 + 10);
    ctx.lineTo(this.width / 2 + 10, 10);
    ctx.lineTo(this.width + 10, this.height / 2 + 10);
    ctx.lineTo(this.width / 2 + 10, this.height + 10);
    ctx.lineTo(10, this.height / 2 + 10);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.stroke();
  }
};

export default Rhombus;
