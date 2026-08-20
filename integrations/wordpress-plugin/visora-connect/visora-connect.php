<?php
/**
 * Plugin Name:       Visora Connect
 * Plugin URI:        https://github.com/ULTRAAAA3000/visora/tree/main/integrations/wordpress-plugin/visora-connect
 * Description:       Connect your WordPress site to Visora and render pixel-perfect OG images, product banners, and certificates from HTML/Tailwind templates — no AI image guessing, real headless Chromium.
 * Version:           1.0.1
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            Visora
 * Author URI:        https://visor-a.com
 * License:            GPL v2 or later
 * License URI:        https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:        visora-connect
 *
 * Core funnel: this plugin's whole job is to get the site owner an API
 * key with as little friction as possible. Click "Connect to Visora",
 * log in (or sign up) on visor-a.com, approve, land back here with the
 * key already saved. Everything else (the render shortcode) is a
 * convenience on top of that.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // No direct access.
}

define( 'VISORA_CONNECT_VERSION', '1.0.1' );
define( 'VISORA_CONNECT_FILE', __FILE__ );
define( 'VISORA_CONNECT_DIR', plugin_dir_path( __FILE__ ) );
define( 'VISORA_CONNECT_URL', plugin_dir_url( __FILE__ ) );

define( 'VISORA_CONNECT_DEFAULT_APP_URL', 'https://visor-a.com' );
define( 'VISORA_CONNECT_DEFAULT_API_URL', 'https://api.visor-a.com' );

/**
 * Small wrapper around get_option() with a fallback — used everywhere
 * instead of raw get_option() so a missing/empty option never silently
 * produces an empty URL we then try to redirect or fetch from.
 */
function visora_get_option( $name, $default = '' ) {
	$value = get_option( $name, $default );
	return ( '' === $value || false === $value ) ? $default : $value;
}

require_once VISORA_CONNECT_DIR . 'includes/class-visora-connect-admin.php';
require_once VISORA_CONNECT_DIR . 'includes/class-visora-connect-handler.php';
require_once VISORA_CONNECT_DIR . 'includes/class-visora-render-shortcode.php';

/**
 * Boot the plugin. Kept as plain function calls (not a big God-object
 * class) — each piece only wires up its own hooks.
 */
function visora_connect_init() {
	Visora_Connect_Admin::init();
	Visora_Connect_Handler::init();
	Visora_Render_Shortcode::init();
}
add_action( 'plugins_loaded', 'visora_connect_init' );

/**
 * Sensible defaults on activation so the settings page isn't empty.
 */
function visora_connect_activate() {
	add_option( 'visora_app_url', VISORA_CONNECT_DEFAULT_APP_URL );
	add_option( 'visora_api_url', VISORA_CONNECT_DEFAULT_API_URL );
	add_option( 'visora_api_key', '' );
	add_option( 'visora_default_template_id', '' );
}
register_activation_hook( __FILE__, 'visora_connect_activate' );
