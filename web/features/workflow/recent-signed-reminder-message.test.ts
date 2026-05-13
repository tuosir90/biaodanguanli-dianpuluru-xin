import { describe, expect, it } from "vitest";
import { RECENT_SIGNED_REMINDER_MESSAGE } from "./recent-signed-reminder-message";

describe("RECENT_SIGNED_REMINDER_MESSAGE", () => {
  it("使用固定的群发提醒话术", () => {
    expect(RECENT_SIGNED_REMINDER_MESSAGE).toBe(
      "老板您好！明天我休息一天，所以当天不会有流程运营记录发到群里，请不用担心。休息日当天有值班同事会登店巡视您的数据，如果出现异常会第一时间跟进处理。后天正式上班后，我会对店铺情况做一次集中梳理和调整，确保不会耽误进度。有什么问题可以在群里留言，值班同事看到会回复。"
    );
  });
});
