<?php

namespace FivePrayer\Core\Helpers\MetaField\Elementor;

defined('ABSPATH') || exit;

use Elementor\Core\DynamicTags\Manager;

class FivePrayerElementorDynamicTags {
    public static function register(Manager $manager): void {
        $manager->register_group('fiveprayer', [
            'title' => 'FivePrayer Fields',
        ]);

        $tags = [
            DynamicTags\FajrBeginsTag::class,
            DynamicTags\FajrIqamahTag::class,
            DynamicTags\DhuhrBeginsTag::class,
            DynamicTags\DhuhrIqamahTag::class,
            DynamicTags\AsrBeginsTag::class,
            DynamicTags\Asr2BeginsTag::class,
            DynamicTags\AsrIqamahTag::class,
            DynamicTags\MaghribBeginsTag::class,
            DynamicTags\MaghribIqamahTag::class,
            DynamicTags\IshaBeginsTag::class,
            DynamicTags\IshaIqamahTag::class,
            DynamicTags\SunriseTag::class,
            DynamicTags\MidnightTag::class,
            DynamicTags\CurrentTimeTag::class,
            DynamicTags\CurrentDateTag::class,
            DynamicTags\HijraDateTag::class,
            DynamicTags\PrayerTimesForTodayTag::class,
            DynamicTags\NextPrayerTag::class,
            DynamicTags\NextPrayerBeginsTimeTag::class,
            DynamicTags\NextPrayerIqamahTimeTag::class,
            DynamicTags\NextPrayerTitleTag::class,
            DynamicTags\NextPrayerBeginsTitleTag::class,
            DynamicTags\NextPrayerIqamahTitleTag::class,
            DynamicTags\FajrNameTag::class,
            DynamicTags\DhuhrNameTag::class,
            DynamicTags\AsrNameTag::class,
            DynamicTags\MaghribNameTag::class,
            DynamicTags\IshaNameTag::class,
            DynamicTags\SunriseNameTag::class,
            DynamicTags\MidnightNameTag::class,
            DynamicTags\SinglePrayerBeginsTitleTag::class,
            DynamicTags\SinglePrayerIqamahTitleTag::class,
            DynamicTags\MasjidNameTag::class,
            DynamicTags\CurrentLocationTag::class,
            DynamicTags\PrayerTitleTag::class,
            DynamicTags\CurrentTitleTag::class,
            DynamicTags\VerticalDailyPrayerTag::class,
        ];

        foreach ($tags as $tag_class) {
            $manager->register_tag($tag_class);
        }
    }
}
