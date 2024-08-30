export default class IdCounter {
  private counter = 0;
  public nextId(): number {
    const counter = this.counter;
    this.counter++;
    return counter;
  }
}
