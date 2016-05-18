export default function nth(f, n) {
    var _i = 0;
    var _n = Math.max(n, 0);
    return function() {
        if (_i === _n) {
            _i = 0;
            return f.apply(this, arguments);
        }
        else {
            _i++;
        }
    }
}
