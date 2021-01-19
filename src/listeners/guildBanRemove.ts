import { GuildAuditLogsEntry, MessageEmbed } from "discord.js";
import { FireGuild } from "../../lib/extensions/guild";
import { FireUser } from "../../lib/extensions/user";
import { Listener } from "../../lib/util/listener";

export default class GuildBanRemove extends Listener {
  constructor() {
    super("guildBanRemove", {
      emitter: "client",
      event: "guildBanRemove",
    });
  }

  async exec(guild: FireGuild, user: FireUser) {
    let action: GuildAuditLogsEntry;
    const auditLogActions = await guild
      .fetchAuditLogs({ limit: 2, type: "MEMBER_BAN_REMOVE" })
      .catch(() => {});
    if (auditLogActions) {
      action = auditLogActions.entries.find(
        (entry) =>
          entry.target &&
          // @ts-ignore
          entry.target?.id == user.id &&
          entry.executor.id != this.client.user.id
      );
      if (!action) return;
    } else return;

    const embed = new MessageEmbed()
      .setColor("#E74C3C")
      .setTimestamp()
      .setAuthor(
        guild.language.get("UNBAN_LOG_AUTHOR", user.toString()),
        user.displayAvatarURL({ size: 2048, format: "png", dynamic: true })
      )
      .addField(guild.language.get("MODERATOR"), action.executor.toString())
      .addField(
        guild.language.get("REASON"),
        action.reason || guild.language.get("MODERATOR_ACTION_DEFAULT_REASON")
      )
      .setFooter(`${user.id} | ${action.executor.id}`);
    return await guild.actionLog(embed, "user_unban");
  }
}