// Tailwind v4 wraps `space-*`/`divide-*` child rules in :where() to drop their
// specificity, and implements the dividers with the opposite edge and logical
// properties. v3 used direct sibling selectors, so restore the v3 selectors and
// declarations; otherwise the admin layout shifts by a pixel or two where those
// utilities are combined with others.
// The scope prefix is already applied by the time :where() rules reach us, e.g.
// `.fiveprayer :where(.divide-y > :not(:last-child))`.
const siblingSelector = /^(\.fiveprayer )?:where\(\.((?:\\.|[^\\\s:])+)\s*>\s*:not\(:last-child\)\)$/;

const fiveprayerCompat = {
	postcssPlugin: 'fiveprayer-v4-compat',
	OnceExit(root) {
		root.walkRules((rule) => {
			const match = rule.selector.match(siblingSelector);
			if (!match) return;
			const [, scope = ''] = match;
			const className = match[2];
			const utility = className.split('\\:').pop();
			const declarations = rule.nodes.filter((node) => node.type === 'decl');

			const space = /^space-([xy])-/.exec(utility);
			if (space) {
				const axis = space[1];
				const start = declarations.find(
					(node) => node.prop === `margin-${axis === 'y' ? 'block' : 'inline'}-start`
				);
				const end = declarations.find(
					(node) => node.prop === `margin-${axis === 'y' ? 'block' : 'inline'}-end`
				);
				const shorthand = declarations.find(
					(node) => node.prop === `margin-${axis === 'y' ? 'block' : 'inline'}`
				);

				if (start && end) {
					// v3: margin-top/left gets (1 - reverse), margin-bottom/right gets reverse.
					start.prop = `margin-${axis === 'y' ? 'top' : 'left'}`;
					end.prop = `margin-${axis === 'y' ? 'bottom' : 'right'}`;
					const startValue = start.value;
					start.value = end.value;
					end.value = startValue;
				} else if (shorthand) {
					shorthand.prop = `margin-${axis === 'y' ? 'top' : 'left'}`;
					shorthand.cloneAfter({
						prop: `margin-${axis === 'y' ? 'bottom' : 'right'}`,
						value: shorthand.value,
					});
				} else {
					return;
				}

				rule.selector = `${scope}.${className} > :not([hidden]) ~ :not([hidden])`;
				return;
			}

			const divide = /^divide-([xy])(?:-(\d+(?:\.\d+)?))?$/.exec(utility);
			if (!divide) return;
			const axis = divide[1];
			const amount = divide[2] ? `${divide[2]}px` : '1px';
			rule.nodes = [];
			rule.append({ prop: `--tw-divide-${axis}-reverse`, value: '0' });
			// v3 paints the start edge on every child but the first; v4 paints the
			// end edge on every child but the last, which moves the divider inside
			// the previous box and shifts its content.
			if (axis === 'y') {
				rule.append({ prop: 'border-top-width', value: `calc(${amount} * (1 - var(--tw-divide-y-reverse)))` });
				rule.append({ prop: 'border-bottom-width', value: `calc(${amount} * var(--tw-divide-y-reverse))` });
			} else {
				rule.append({ prop: 'border-right-width', value: `calc(${amount} * var(--tw-divide-x-reverse))` });
				rule.append({ prop: 'border-left-width', value: `calc(${amount} * (1 - var(--tw-divide-x-reverse)))` });
			}
			rule.selector = `${scope}.${className} > :not([hidden]) ~ :not([hidden])`;
		});

		// Tailwind v4 emits its rules inside native cascade layers. Unlayered
		// WordPress admin CSS would then outrank every utility, so flatten the
		// layers back to plain rules (the v3 cascade) to keep the admin design.
		root.walkAtRules('layer', (atRule) => {
			if (atRule.nodes && atRule.nodes.length) {
				atRule.replaceWith(atRule.nodes);
			} else {
				atRule.remove();
			}
		});
	},
};

module.exports = {
	plugins: [
		require('@tailwindcss/postcss'),
		fiveprayerCompat,
		require('postcss-prefix-selector')({
			prefix: '.fiveprayer',
			includeFiles: [/index\.css$/],
			transform(prefix, selector, prefixedSelector) {
				if (/^(html|body)/.test(selector)) {
					return selector.replace(/^([^\s]*)/, `$1 ${prefix}`);
				}
				if (/^(:root|:host)$/.test(selector.trim())) {
					return prefix;
				}
				if (/^\.(wp-admin|fiveprayer)/.test(selector)) {
					return selector;
				}
				return prefixedSelector;
			},
		}),
		require('cssnano')({
			preset: 'default',
		}),
	],
};
