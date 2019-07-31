class ErrorController {
    static trigger(Command) {
        console.error('usage: teambox ' + Command.command());
        process.exit(1);
    }
}

module.exports = ErrorController;