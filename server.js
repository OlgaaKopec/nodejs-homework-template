const app = require('./app');
require('dotenv').config();

const { PORT } = process.env;

const port = PORT || 3001;
app.listen(port, () => {
  console.log(`Server running. Use our API on port: ${port}`);
});
