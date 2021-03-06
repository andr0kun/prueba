import {
  PaginatorEmbedInterface,
  WrappedPaginator,
} from "@fire/lib/util/paginators";
import { Formatters, MessageEmbed, Permissions } from "discord.js";
import { FireMessage } from "@fire/lib/extensions/message";
import { Language } from "@fire/lib/util/language";
import { Command } from "@fire/lib/util/command";

export default class Reminders extends Command {
  constructor() {
    super("reminders", {
      description: (language: Language) =>
        language.get("REMINDERS_COMMAND_DESCRIPTION"),
      clientPermissions: [
        Permissions.FLAGS.SEND_MESSAGES,
        Permissions.FLAGS.EMBED_LINKS,
      ],
      aliases: ["listremind", "listreminders"],
      enableSlashCommand: true,
      restrictTo: "all",
      slashOnly: true,
    });
  }

  async exec(message: FireMessage) {
    const remindersResult = await this.client.db.query(
      "SELECT * FROM remind WHERE uid=$1",
      [message.author.id]
    );
    if (!remindersResult.rows.length)
      return await message.error("REMINDERS_NONE_FOUND");
    const paginator = new WrappedPaginator("", "", 1980);
    let index = 1;
    for await (const reminder of remindersResult) {
      const forwhen = reminder.get("forwhen") as Date;
      paginator.addLine(
        `[${index++}] ${reminder.get("reminder")} - ${Formatters.time(
          forwhen,
          "R"
        )}`
      );
    }
    const embed = new MessageEmbed().setColor(message.member?.displayColor);
    const paginatorInterface = new PaginatorEmbedInterface(
      this.client,
      paginator,
      {
        owner: message.member || message.author,
        embed,
        footer: {
          text: message.language.get("REMINDERS_FOOTER", {
            prefix: message.util?.parsed?.prefix,
          }),
        },
      }
    );
    return await paginatorInterface.send(message.channel);
  }
}
