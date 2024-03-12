import Shape from './Shape';

class Rectangle extends Shape {
  draw () {
    const cvs = document.querySelector(`#${this.id} canvas`)! as HTMLCanvasElement;
    const ctx = cvs.getContext('2d')!;
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.beginPath();
    ctx.rect(10, 10, this.width, this.height);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
  };
};

export default Rectangle;
