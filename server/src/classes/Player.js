export class Player {
  /**
   * @param {Object} options
   * @param {string} options.id - Unique player ID
   * @param {string} options.socketId - Active socket connection ID
   * @param {string} options.name - Display name
   */
  constructor({ id, socketId, name }) {
    this.id = id;
    this.socketId = socketId;
    this.name = name;
    this.score = 0;
    this.isDrawing = false;
    this.connected = true;
    this.hasGuessedCorrectly = false;
  }

  resetRoundState() {
    this.hasGuessedCorrectly = false;
    this.isDrawing = false;
  }

  toPublic() {
    return {
      id: this.id,
      name: this.name,
      score: this.score,
      isDrawing: this.isDrawing,
      connected: this.connected,
      hasGuessedCorrectly: this.hasGuessedCorrectly
    };
  }
}
