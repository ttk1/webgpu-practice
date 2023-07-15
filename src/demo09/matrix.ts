export class Matrix {
  public m: number;
  public n: number;
  private matrix: number[][];

  public constructor(m: number, n: number);
  public constructor(m: number, n: number, arr: number[]);
  public constructor(m: number, n: number, arr?: number[]) {
    this.m = m;
    this.n = n;

    if (arr != null) {
      // arr が与えられていたら、arr で初期化する
      if (arr.length != m * n) {
        throw new Error('サイズの不一致');
      }
      this.matrix = [];
      for (let i = 0; i < m; i++) {
        this.matrix[i] = [];
        for (let j = 0; j < n; j++) {
          this.matrix[i][j] = arr[i + m * j];
        }
      }
    } else {
      this.matrix = [];
      for (let i = 0; i < m; i++) {
        this.matrix[i] = [];
        for (let j = 0; j < n; j++) {
          this.matrix[i][j] = 0;
        }
      }
    }
  }

  public setValue(i: number, j: number, value: number): void {
    if (i < 0 || i >= this.m || j < 0 || j >= this.n) {
      throw new Error('範囲外');
    }
    this.matrix[i][j] = value;
  }

  public getValue(i: number, j: number): number {
    if (i < 0 || i >= this.m || j < 0 || j >= this.n) {
      throw new Error('範囲外');
    }
    return this.matrix[i][j];
  }

  /**
   * この行列に mat を右から乗算したものを返す
   * @param mat
   * @returns この行列にmatを右から乗算した結果
   */
  public mul(mat: Matrix): Matrix {
    if (this.n != mat.m) {
      throw new Error('サイズの不一致');
    }

    const newMat = new Matrix(this.m, mat.n);
    for (let i = 0; i < this.m; i++) {
      for (let j = 0; j < mat.n; j++) {
        let sum = 0;
        for (let k = 0; k < this.n; k++) {
          sum += this.getValue(i, k) * mat.getValue(k, j);
        }
        newMat.setValue(i, j, sum);
      }
    }
    return newMat;
  }

  public toArray(): number[] {
    const arr = [];
    for (let i = 0; i < this.m; i++) {
      for (let j = 0; j < this.n; j++) {
        arr[i + this.m * j] = this.getValue(i, j);
      }
    }
    return arr;
  }
}
