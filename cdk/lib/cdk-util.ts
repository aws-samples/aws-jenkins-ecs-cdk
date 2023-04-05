import { Stack } from "aws-cdk-lib";

export class CdkUtil {
  private stack: Stack;

  constructor(stack: Stack) {
    this.stack = stack;
  }

  public getCdkContextValue(key: string) {
    let val = this.stack.node.tryGetContext(key);

    if (val === "UPDATEME") {
      throw Error(key + " cannot be the default UPDATEME value");
    }

    if (val === null || val === undefined || val === "") {
      throw Error(key + " cannot be null or empty or DEFAULT value");
    }
    return val;
  }
}
