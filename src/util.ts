/// <reference path="refs.d.ts" />

class EnumEx {
  static getNames(e: any): string[] {
    var a:string[] = [];
    for (var val in e) {
      if (isNaN(val)) {
        a.push(val);
      }
    }

    return a;
  }

  static getValues(e: any):number[] {
    var a: number[] = [];
    for (var val in e) {
      if (!isNaN(val)) {
        a.push(parseInt(val, 10));
      }
    }

    return a;
  }
}