// ==UserScript==
// @name         Attack Log Helper
// @namespace    TornExtensions
// @version      1.0
// @description  none
// @author       htys [1545351]
// @match        https://www.torn.com/loader.php?sid=attackLog&ID=*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/AttackLogHelper.js
// @downloadURL    https://raw.githubusercontent.com/zmpress/game_script/refs/heads/main/porn_city/userscript/AttackLogHelper.js

// ==/UserScript==

(function() {
    'use strict';
    const $ = window.jQuery;
    const icon_ignore_list = [
        'attack-join',
        'miss',
        'attack-win',
        'hospitalize',
        'booster-use',
        'critical-hit',
        'grenade-use',
        'standart-damage',
        'reloading',
        'ziro-damage',
        'attack-lose',
        'leave',
        'mug',
        'stalemate',
        'loot'
    ];
    const attack_page_interval = setInterval(updateAttackPage, 300);
    function updateAttackPage() {
        const target_nodes = $('.log-list > li > .message-wrap > [class^="attacking-events"]');
        target_nodes.each(function() {
            const li_node = $(this).parent().parent();
            if (li_node.attr('detected') != '1') {
                li_node.attr('detected', '1');
                const icon_class = $(this).attr('class');
                if (icon_class && icon_class.indexOf('attacking-events') >= 0) {
                    const icon_text = icon_class.replace('attacking-events-', '');

                    if (icon_ignore_list.indexOf(icon_text) == -1) {
                        const icon_info = getBonusInfo(icon_text);
                        let bonus = '';
                        if (icon_info) {
                            bonus = icon_info;
                        }
                        else {
                            console.log(icon_text + ' not found.')
                        }
                        $(this).after(`
                        <span class='message icon-text border-round' style='width: fit-content; padding: 1px 4px; font-weight: bold; text-align: center; color: #eee; 
                        background-color: var(--default-blue-dark-color);' title='${bonus}'>${icon_text}</span>`);
                        const icon_width = $(this).siblings('.message.icon-text.border-round').width();

                        const ori_msg = $(this).siblings('[class="message"]');
                        const ori_msg_width = ori_msg.width();
                        ori_msg.width(ori_msg_width - icon_width - 18);
                    }
                }
            }
        });
    }
    function getBonusInfo(bonus_name) {
        const bonus_info = {
            'Demoralized': '<b>士气低落</b>(debuff)使每个对手的战斗属性降低10%。最多可叠加5次，使所有属性降低50%',
            'Freeze': '<b>冻结</b>(debuff)使对手的speed和dexterity降低50%。每次只能应用一个冻结效果，尽管它可以与其他被动效果同时应用',
            'Blindfire': '<b>盲射</b>(buff)导致你在一回合内使用当前弹夹中剩余的所有子弹进行射击。每次成功的射击，MG3的准确性降低5.00',
            'Poisoned': '<b>中毒</b>(dot)会引发一个长期的持续伤害效果，伤害的初始值为触发时造成伤害的95%，并在19回合内逐渐减少至零',
            'burning': '<b>燃烧</b>(dot)会引发一个短期的持续伤害效果，伤害的初始值为触发时造成伤害的45%，并在3回合内逐渐减少至零',
            'lacerated': '<b>撕裂</b>(dot)会引发一个毁灭性的持续伤害效果，伤害的初始值为触发时造成伤害的90%，并在9回合内逐渐减少至零',
            'burn': '<b>严重燃烧</b>(dot)会引发一个短期的持续伤害效果，伤害的初始值为触发时造成伤害的45%，并在3回合内逐渐减少至零',
            'Spray': '<b>喷射</b>(buff)会在一回合内将整个弹夹的子弹射向对手，造成正常命中的两倍伤害。只有当弹夹是满的时候才能触发',
            'Emasculate': '<b>娘化</b>(buff)使你在用粉色MAC-10进行最后一击时，获得你的最大幸福值的一定百分比',
            'Hazardous': '<b>灾害</b>(debuff)会导致你在输出伤害时受到一定比例的反伤',
            'Storage': '<b>储物</b>(buff)允许你在战斗中使用两个临时武器。为了取出第二个临时武器，你必须额外使用一回合',
            'Toxin': '<b>毒素</b>(debuff)会降低对手一个随机属性的25%，最多可叠加3次，共减少75%',
            'Sleep': '<b>嗜睡</b>(debuff)会导致敌人在受到伤害之前错过所有回合',

            'Achilles': '<b>阿喀琉斯</b>(buff)足部伤害增加',
            'Assassinate': '<b>暗杀</b>(buff)首回合伤害增加',
            'Backstab': '<b>背刺</b>(buff)对分心的目标造成双倍伤害',
            'Berserk': '<b>狂怒</b>(buff/debuff)伤害增加，命中几率降低',
            'bleeding': '<b>流血</b>(dot)会引发一个长期的持续伤害效果，伤害的初始值为触发时造成伤害的45%，并在9回合内逐渐减少至零',
            'Blindside': '<b>偷袭</b>(buff)对满生命值的目标造成伤害增加',
            'Bloodlust': '<b>嗜血</b>(buff)恢复生命值，恢复量为造成伤害的(%)',
            'Comeback': '<b>反攻</b>(buff)处于1/4生命值以下时伤害增加',
            'Conserve': '<b>节约</b>(buff)弹药使用效率提高',
            'crippled': '<b>致残</b>(debuff)dexerity降低25%，最多可叠加3次',

            'Crusher': '<b>粉碎</b>(buff)头部伤害增加',
            'Cupid': '<b>丘比特</b>(buff)心脏伤害增加',
            'Deadeye': '<b>神枪手</b>(buff)暴击伤害增加',
            'Deadly': '<b>致命</b>(buff)伤害增加500%',
            'Disarm': '<b>缴械</b>(debuff)武器失效，持续(X)回合。',
            'Double-tap': '<b>双刃</b>(buff)本回合命中两次',
            'Double-edged': '<b>连射</b>(buff)伤害翻倍，会反伤自己一定比例伤害',
            'Empower': '<b>增强</b>(buff)使用该武器时的strength增加',
            'eviscareted': '<b>剔骨</b>(debuff)受到额外伤害',
            'Execute': '<b>处决</b>(buff)对生命值低于(%)的目标，一击即杀(需要命中且伤害不能为0)',

            'Expose': '<b>暴露</b>(buff)暴击几率增加',
            'Finale': '<b>大结局</b>(buff)武器未使用的每个回合，都使未来使用该武器时伤害增加',
            'Focus': '<b>专注</b>(buff)每次连续未命中，都使命中几率增加',
            'Frenzy': '<b>狂热</b>(buff)每次连续命中，都使伤害和命中几率增加',
            'Fury': '<b>愤怒</b>(buff)本回合命中两次',
            'Grace': '<b>优雅</b>(buff/debuff)命中几率增加，伤害减少',
            'Home run': '<b>全垒打</b>(buff)反弹来袭的临时武器',
            'motivated': '<b>激励</b>(buff)增加所有属性，最多可叠加5次',
            'Irradiate': '<b>辐射</b>(debuff)击杀时，施加1-3小时的辐射效果',
            'Paralyze': '<b>麻痹</b>(debuff)增加300秒的麻痹效果(50%几率无法行动)',

            'Parry': '<b>招架</b>(debuff)阻挡来袭的近战攻击，并反击',
            'Penetrate': '<b>穿透</b>(debuff)无视(%)的护甲',
            'Plunder': '<b>抢劫</b>(buff)击杀时，mug所得金钱增加',
            'Powerful': '<b>强力</b>(buff)伤害增加',
            'experience': '<b>熟练</b>(buff)击杀时，获得的经验值增加',
            'Puncture': '<b>穿刺</b>(buff)无视全部护甲',
            'Quicken': '<b>加速	</b>(buff)使用该武器时的speed增加',
            'Rage': '<b>狂怒</b>(buff)一回合内命中2-8次',
            'Revitalize': '<b>复苏</b>(buff)击杀时，恢复攻击所消耗的能量',
            'Roshambo': '<b>石头剪刀布</b>(buff)腹股沟伤害增加',

            'slowed': '<b>减速</b>(debuff)speed降低25%，最多可叠加3次',
            'Smurf': '<b>虐菜</b>(buff)等级比对手每低一级伤害增加(%)',
            'Specialist': '<b>专家</b>(buff)增加伤害(只限首个弹夹)',
            'Stricken': '<b>打击</b>(buff)击杀时，住院时间增加',
            'Stun': '<b>击晕</b>(debuff)使对手错过下回合',
            'Suppress': '<b>压制</b>(debuff)使对手有25%的几率错过下回合',
            'SureShot': '<b>必中</b>(buff)100%命中',
            'Throttle': '<b>扼杀</b>(buff)喉咙伤害增加',
            'Warlord': '<b>战争之王</b>(buff)击杀时，获得的respect值增加',
            'Weakened': '<b>削弱</b>(debuff)defense降低25%，最多可叠加3次',

            'Wind-up': '<b>蓄力</b>(buff)在花费一回合蓄力后，伤害增加',
            'Withered': '<b>凋零</b>(debuff)strength降低25%，最多可叠加3次',

            'Riot': '<b>坚不可摧</b>减少对手近战伤害',
            'Assault': '<b>铜墙铁壁</b>减少对手子弹伤害',
            'Dune': '<b>难以逾越</b>当生命值低于1/4时，减少对手伤害',
            'Delta': '<b>金刚不坏</b>减少负面状态效果',
            'Marauder': '<b>钢铁之躯</b>增加最大生命值',
            'Sentinel': '<b>固若金汤</b>增加防御被动效果',
            'EOD': '<b>无懈可击</b>完全格挡进攻伤害',

            'cauterise': '<b>回血</b>(buff)使每回合有10%的概率回复20%血量，5星Gas Station技能',
            'hardbody': '<b>肌肉男</b>(buff)可以抵挡30%近战武器伤害，10星Ladies Strip Club技能',
            'notouching': '<b>别摸我</b>(buff)可以有1/4概率躲闪近战武器的攻击，10星Gents Strip Club技能',
            'shock': '<b>电击</b>(debuff)使对手错过下回合'
        };
        let info_text = undefined;
        for (let index in bonus_info) {

            if (bonus_name == index.toLowerCase()) {
                console.log(bonus_name + ' has found.')
                info_text = bonus_info[index];
            }
        }
        return info_text;
    }
})();