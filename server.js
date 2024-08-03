require('dotenv').config();
const app = require('./app');

const { PORT } = process.env;

const port = PORT || 3000;
app.listen(port, () => {
  console.log(`Server running. Use our API on port: ${port}`);
});
