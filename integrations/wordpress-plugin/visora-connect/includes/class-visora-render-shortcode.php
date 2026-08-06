<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * [visora_render template="tpl_ecom_v1" title="..." price="..."]
 *
 * Calls POST {api_url}/api/v1/render server-side (via wp_remote_post, so
 * the API key never reaches the visitor's browser) and outputs an <img>
 * pointing at the resulting CDN URL. The response is cached in a
 * transient keyed by the shortcode's attributes, so repeat page loads
 * don't re-render — the Worker's own `cache` option covers identical
 * requests, but this also saves the outbound HTTP round-trip on every
 * page view.
 */
class Visora_Render_Shortcode {

	const CACHE_TTL = DAY_IN_SECONDS;

	public static function init() {
		add_shortcode( 'visora_render', array( __CLASS__, 'render' ) );
	}

	public static function render( $atts ) {
		$api_key = visora_get_option( 'visora_api_key' );
		if ( empty( $api_key ) ) {
			return current_user_can( 'manage_options' )
				? '<p style="color:#b32d2e;">' . esc_html__( 'Visora: connect your site under Settings > Visora before using [visora_render].', 'visora-connect' ) . '</p>'
				: '';
		}

		$atts = shortcode_atts(
			array(
				'template' => visora_get_option( 'visora_default_template_id' ),
				'format'   => 'png',
				'alt'      => '',
				'class'    => 'visora-render',
			),
			$atts,
			'visora_render'
		);

		$template_id = $atts['template'];
		if ( empty( $template_id ) ) {
			return current_user_can( 'manage_options' )
				? '<p style="color:#b32d2e;">' . esc_html__( 'Visora: [visora_render] needs a template="..." attribute (or set a default under Settings > Visora).', 'visora-connect' ) . '</p>'
				: '';
		}

		// Everything besides the known keys becomes template data.
		$data = $atts;
		unset( $data['template'], $data['format'], $data['alt'], $data['class'] );

		$cache_key = 'visora_render_' . md5( wp_json_encode( $atts ) );
		$image_url = get_transient( $cache_key );

		if ( false === $image_url ) {
			$image_url = self::call_render_api( $api_key, $template_id, $atts['format'], $data );
			if ( is_wp_error( $image_url ) ) {
				return current_user_can( 'manage_options' )
					? '<p style="color:#b32d2e;">' . esc_html( sprintf(
						/* translators: %s: error message */
						__( 'Visora render failed: %s', 'visora-connect' ),
						$image_url->get_error_message()
					) ) . '</p>'
					: '';
			}
			set_transient( $cache_key, $image_url, self::CACHE_TTL );
		}

		return sprintf(
			'<img src="%s" alt="%s" class="%s" loading="lazy" />',
			esc_url( $image_url ),
			esc_attr( $atts['alt'] ),
			esc_attr( $atts['class'] )
		);
	}

	/**
	 * @return string|WP_Error Image URL, or WP_Error on failure.
	 */
	private static function call_render_api( $api_key, $template_id, $format, $data ) {
		$api_url = trailingslashit( visora_get_option( 'visora_api_url', VISORA_CONNECT_DEFAULT_API_URL ) );

		$response = wp_remote_post(
			$api_url . 'api/v1/render',
			array(
				'timeout' => 20,
				'headers' => array(
					'Authorization' => 'Bearer ' . $api_key,
					'Content-Type'  => 'application/json',
				),
				'body'    => wp_json_encode(
					array(
						'template_id' => $template_id,
						'format'      => $format,
						'cache'       => true,
						'data'        => $data,
					)
				),
			)
		);

		if ( is_wp_error( $response ) ) {
			return $response;
		}

		$code = wp_remote_retrieve_response_code( $response );
		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( $code < 200 || $code >= 300 || empty( $body['success'] ) || empty( $body['data']['url'] ) ) {
			$message = ! empty( $body['error'] ) ? $body['error'] : sprintf( 'HTTP %d', $code );
			return new WP_Error( 'visora_render_failed', $message );
		}

		return $body['data']['url'];
	}
}
