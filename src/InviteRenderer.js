const svgdom = require('svgdom')
const SVG = require('@svgdotjs/svg.js')
const TextToSVG = require('text-to-svg')
const Discord = require('./Discord.js')

SVG.extend([SVG.Path, SVG.Circle], {
  rightmost: function () {
    return this.x() + this.width()
  },
  lowermost: function () {
    return this.y() + this.height()
  }
})

const whitneyBold = TextToSVG.loadSync('./src/fonts/WhitneyBoldRegular.ttf')
const whitneySemibold = TextToSVG.loadSync('./src/fonts/WhitneySemiboldRegular.ttf')
const whitneyMedium = TextToSVG.loadSync('./src/fonts/WhitneyMediumRegular.ttf')

const strings = require('./strings.json')

const PADDING = 16
const ICON_SIZE = 50

const HEADER_FONT_SIZE = 12
const HEADER_LINE_HEIGHT = 16
const HEADER_MARGIN_BOTTOM = 12

const SERVER_NAME_SIZE = 16
const SERVER_NAME_LINE_HEIGHT = 20
const SERVER_NAME_MARGIN_BOTTOM = 2

const PRESENCE_FONT_SIZE = 14
const PRESENCE_LINE_HEIGHT = 16
const PRESENCE_TEXT_MARGIN_RIGHT = 8

const PRESENCE_DOT_SIZE = 8
const PRESENCE_DOT_MARGIN_RIGHT = 4

const INVITE_WIDTH = 430
const INVITE_HEIGHT = 110

const BUTTON_WIDTH = 94.75
const BUTTON_HEIGHT = 40
const BUTTON_MARGIN_LEFT = 10

const BADGE_MARGIN_RIGHT = 8

const Constants = require('./constants.js')
const BADGES = {
  VERIFIED: {
    FLOWERSTAR_COLOR: '#7289da',
    ICON: Constants.VERIFIED_ICON
  },
  PARTNERED: {
    FLOWERSTAR_COLOR: '#4087ed',
    ICON: Constants.PARTNER_ICON
  }
}

module.exports = class InviteRenderer {
  static async render (inviteCode, language = 'en', animation = true) {
    const invite = await Discord.getInvite(inviteCode)
    const locale = strings[language] || strings.en
    const window = svgdom.createSVGWindow()
    const document = window.document
    SVG.registerWindow(window, document)
    const canvas = SVG.SVG(document.documentElement)
    canvas.viewbox(0, 0, INVITE_WIDTH, INVITE_HEIGHT).width(INVITE_WIDTH).height(INVITE_HEIGHT)

    // Background
    canvas.rect(INVITE_WIDTH, INVITE_HEIGHT).radius(3).fill('#2f3136')

    // Main Container
    const mainContainer = canvas.nested()
      .width(INVITE_WIDTH - 2 * PADDING)
      .height(INVITE_HEIGHT - 2 * PADDING)
      .move(PADDING, PADDING)

    // Header
    const headerContainer = mainContainer.nested().width(mainContainer.width()).height(HEADER_LINE_HEIGHT)
    headerContainer.path(whitneyBold.getD(locale.header.toUpperCase(), { anchor: 'top left', fontSize: HEADER_FONT_SIZE })).fill('#b9bbbe')

    // Content Container
    const contentContainer = mainContainer.nested()
      .width(mainContainer.width())
      .height(mainContainer.height() - headerContainer.height() - HEADER_MARGIN_BOTTOM)
      .move(0, headerContainer.height() + HEADER_MARGIN_BOTTOM)

    // Server Icon
    const iconBase64 = await Discord.getIcon(invite.guild.id, invite.guild.icon)
    const squircle = contentContainer.rect(ICON_SIZE, ICON_SIZE).radius(16).fill('#2f3136')
    const iconImage = contentContainer.image(`data:image/${invite.guild.icon.startsWith('a_') ? 'gif' : 'jpg'};base64,${iconBase64}`).size(ICON_SIZE, ICON_SIZE)
    iconImage.clipWith(squircle)

    // Join button
    const buttonContainer = contentContainer.nested()
      .width(BUTTON_WIDTH)
      .height(BUTTON_HEIGHT)
      .move(contentContainer.width() - BUTTON_WIDTH, (contentContainer.height() - BUTTON_HEIGHT) / 2)
    buttonContainer.rect(BUTTON_WIDTH, BUTTON_HEIGHT)
      .radius(3)
      .fill('#43b581')
    const joinButtonText = buttonContainer.path(whitneyMedium.getD(locale.button, { fontSize: 14 }))
      .fill('#ffffff')
    joinButtonText.move((BUTTON_WIDTH - joinButtonText.width()) / 2, (BUTTON_HEIGHT - joinButtonText.height()) / 2)

    let EXTRA_SERVER_NAME_PADDING = 0

    const innerContainer = contentContainer.nested()
      .width(contentContainer.width() - ICON_SIZE - PADDING - BUTTON_WIDTH - BUTTON_MARGIN_LEFT)
      .height(SERVER_NAME_LINE_HEIGHT + SERVER_NAME_MARGIN_BOTTOM + PRESENCE_LINE_HEIGHT)
      .x(ICON_SIZE + PADDING, 0)
    innerContainer.y((contentContainer.height() - innerContainer.height()) / 2)

    const badgeContainer = innerContainer.nested().y(2)

    // Partner Badge
    if (invite.guild.features.includes('PARTNERED')) {
      const flowerStar = badgeContainer.path(Constants.SPECIAL_BADGE).fill(BADGES.PARTNERED.FLOWERSTAR_COLOR)
      badgeContainer.path(Constants.PARTNER_ICON).fill('#ffffff')
      EXTRA_SERVER_NAME_PADDING = flowerStar.width() + BADGE_MARGIN_RIGHT
    }

    // Verified Badge
    if (invite.guild.features.includes('VERIFIED')) {
      const flowerStar = badgeContainer.path(Constants.SPECIAL_BADGE)
        .fill(BADGES.VERIFIED.FLOWERSTAR_COLOR)
      badgeContainer.path(Constants.VERIFIED_ICON).fill('#ffffff')
      EXTRA_SERVER_NAME_PADDING = flowerStar.width() + BADGE_MARGIN_RIGHT
    }

    // Server Name
    const serverNameText = innerContainer.path(whitneySemibold.getD(invite.guild.name, { anchor: 'top left', fontSize: SERVER_NAME_SIZE }))
      .fill('#ffffff')
      .x(EXTRA_SERVER_NAME_PADDING)
    serverNameText.y((SERVER_NAME_LINE_HEIGHT - serverNameText.height) / 2)

    // innerContainer.rect(innerContainer.width(), innerContainer.height()).fill('#ff0000')

    const presenceContainer = innerContainer.nested()
      .height(PRESENCE_LINE_HEIGHT)
      .width(innerContainer.width())
      .y(SERVER_NAME_LINE_HEIGHT + SERVER_NAME_MARGIN_BOTTOM)

    // Online and member counts
    presenceContainer.circle(PRESENCE_DOT_SIZE)
      .fill('#43b581')
      .y((PRESENCE_LINE_HEIGHT - PRESENCE_DOT_SIZE) / 2)
    const presenceText = presenceContainer.path(whitneySemibold.getD(locale.online.replace('{{count}}', invite.approximate_presence_count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')), { fontSize: PRESENCE_FONT_SIZE }))
      .fill('#b9bbbe')
      .x(PRESENCE_DOT_SIZE + PRESENCE_DOT_MARGIN_RIGHT)
    presenceText.y((PRESENCE_LINE_HEIGHT - presenceText.height()) / 2)
    presenceContainer.circle(PRESENCE_DOT_SIZE)
      .fill('#747f8d')
      .y((PRESENCE_LINE_HEIGHT - PRESENCE_DOT_SIZE) / 2)
      .x(PRESENCE_DOT_SIZE + PRESENCE_DOT_MARGIN_RIGHT + presenceText.width() + PRESENCE_TEXT_MARGIN_RIGHT)
    const membersText = presenceContainer.path(whitneySemibold.getD(locale.members.replace('{{count}}', invite.approximate_member_count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')), { fontSize: PRESENCE_FONT_SIZE }))
      .fill('#b9bbbe')
      .x(PRESENCE_DOT_SIZE + PRESENCE_DOT_MARGIN_RIGHT + presenceText.width() + PRESENCE_TEXT_MARGIN_RIGHT + PRESENCE_DOT_SIZE + PRESENCE_DOT_MARGIN_RIGHT)
    membersText.y((PRESENCE_LINE_HEIGHT - membersText.height()) / 2)

    return canvas.svg()
  }
}