<?php
/**
 * Handles the outbound "Connect to Visora" redirect and the inbound
 * admin-post callback that delivers the API key back to this site.
 *
 * Security model: WordPress never sends credentials anywhere. It sends
 * the browser (an already-authenticated wp-admin user) to visor-a.com
 * with a random, single-use `state` token stored server-side in a
 * transient. Visora's /connect page shows the user what's being
 * requested and, on approval, redirects the browser BACK to WordPress
 * with the API key + the same state token. We only accept the callback
 * if the state matches an unexpired transient we created, which is
 * then immediately deleted — this stops replay and stops a forged
 * callback from a URL the plugin never generated.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Visora_Connect_Handler {

	const STATE_TRANSIENT_PREFIX = 'visora_connect_state_';
	const STATE_TTL              = 10 * MINUTE_IN_SECONDS;

	public static function init() {
		add_action( 'admin_post_visora_connect_start', array( __CLASS__, 'start' ) );
		add_action( 'admin_post_visora_connect_callback', array( __CLASS__, 'callback' ) );
		add_action( 'admin_post_visora_connect_disconnect', array( __CLASS__, 'disconnect' ) );
	}

	/**
	 * Step 1: admin clicks "Connect to Visora" -> here -> redirect to
	 * Visora's /connect page.
	 */
	public static function start() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to do this.', 'visora-connect' ) );
		}
		check_admin_referer( 'visora_connect_start' );

		$state = wp_generate_password( 32, false );
		set_transient( self::STATE_TRANSIENT_PREFIX . $state, 1, self::STATE_TTL );

		$return_url = admin_url( 'admin-post.php?action=visora_connect_callback' );
		$app_url    = trailingslashit( visora_get_option( 'visora_app_url', VISORA_CONNECT_DEFAULT_APP_URL ) );

		$connect_url = add_query_arg(
			array(
				'return_url' => rawurlencode( $return_url ),
				'state'      => rawurlencode( $state ),
				'app'        => rawurlencode( 'WordPress (' . wp_parse_url( home_url(), PHP_URL_HOST ) . ')' ),
			),
			$app_url . 'connect'
		);

		wp_redirect( $connect_url );
		exit;
	}

	/**
	 * Step 2: Visora redirects back here with ?api_key=...&state=...
	 */
	public static function callback() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to do this.', 'visora-connect' ) );
		}

		$state   = isset( $_GET['state'] ) ? sanitize_text_field( wp_unslash( $_GET['state'] ) ) : '';
		$api_key = isset( $_GET['api_key'] ) ? sanitize_text_field( wp_unslash( $_GET['api_key'] ) ) : '';

		$transient_key = self::STATE_TRANSIENT_PREFIX . $state;
		$is_valid_state = $state && get_transient( $transient_key );

		if ( ! $is_valid_state || ! $api_key ) {
			self::redirect_to_settings( 'error' );
		}

		delete_transient( $transient_key ); // single-use

		update_option( 'visora_api_key', $api_key );
		self::redirect_to_settings( 'connected' );
	}

	public static function disconnect() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to do this.', 'visora-connect' ) );
		}
		check_admin_referer( 'visora_connect_disconnect' );

		update_option( 'visora_api_key', '' );
		self::redirect_to_settings( 'disconnected' );
	}

	private static function redirect_to_settings( $status ) {
		$url = add_query_arg(
			array(
				'page'            => 'visora-connect',
				'visora_status'   => $status,
			),
			admin_url( 'options-general.php' )
		);
		wp_redirect( $url );
		exit;
	}
}
