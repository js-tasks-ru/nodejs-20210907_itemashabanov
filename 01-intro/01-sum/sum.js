function sum(a, b) {
  if (!(typeof(a) === 'number' && typeof(b) === 'number'))
    throw new TypeError("You'r need enter a number!");

  return a + b;
}

module.exports = sum;
