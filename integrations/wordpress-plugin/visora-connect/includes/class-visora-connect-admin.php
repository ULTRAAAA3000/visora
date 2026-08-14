<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Visora_Connect_Admin {

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_settings_page' ) );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );
	}

	public static function add_settings_page() {
		add_options_page(
			__( 'Visora', 'visora-connect' ),
			__( 'Visora', 'visora-connect' ),
			'manage_options',
			'visora-connect',
			array( __CLASS__, 'render_settings_page' )
		);
	}

	public static function register_settings() {
		register_setting( 'visora_connect_settings', 'visora_app_url', array( 'sanitize_callback' => 'esc_url_raw' ) );
		register_setting( 'visora_connect_settings', 'visora_api_url', array( 'sanitize_callback' => 'esc_url_raw' ) );
		register_setting( 'visora_connect_settings', 'visora_default_template_id', array( 'sanitize_callback' => 'sanitize_text_field' ) );
	}

	public static function render_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$api_key       = visora_get_option( 'visora_api_key' );
		$is_connected  = ! empty( $api_key );
		$status        = isset( $_GET['visora_status'] ) ? sanitize_text_field( wp_unslash( $_GET['visora_status'] ) ) : '';
		$app_url       = visora_get_option( 'visora_app_url', VISORA_CONNECT_DEFAULT_APP_URL );
		$api_url       = visora_get_option( 'visora_api_url', VISORA_CONNECT_DEFAULT_API_URL );
		$default_tpl   = visora_get_option( 'visora_default_template_id' );
		?>
		<div class="wrap visora-connect-settings">
			<h1><?php esc_html_e( 'Visora', 'visora-connect' ); ?></h1>

			<?php if ( 'connected' === $status ) : ?>
				<div class="notice notice-success"><p><?php esc_html_e( 'Connected to Visora — your API key was saved.', 'visora-connect' ); ?></p></div>
			<?php elseif ( 'disconnected' === $status ) : ?>
				<div class="notice notice-info"><p><?php esc_html_e( 'Disconnected from Visora.', 'visora-connect' ); ?></p></div>
			<?php elseif ( 'error' === $status ) : ?>
				<div class="notice notice-error"><p><?php esc_html_e( 'Could not connect to Visora — the request expired or was invalid. Please try again.', 'visora-connect' ); ?></p></div>
			<?php endif; ?>

			<div class="card" style="max-width:640px;padding:1.5em 2em;margin-top:1em;">
				<?php if ( $is_connected ) : ?>
					<h2 style="margin-top:0;">✅ <?php esc_html_e( 'Connected', 'visora-connect' ); ?></h2>
					<p>
						<label for="visora-api-key"><strong><?php esc_html_e( 'API key', 'visora-connect' ); ?></strong></label><br />
						<input id="visora-api-key" type="text" readonly
							value="<?php echo esc_attr( $api_key ); ?>"
							style="width:100%;max-width:480px;font-family:monospace;" />
					</p>
					<p class="description">
						<?php esc_html_e( 'Use this key from a shortcode with [visora_render], or in your own PHP with wp_remote_post(). See the quick-start below.', 'visora-connect' ); ?>
					</p>
					<p>
						<a class="button" href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=visora_connect_start' ), 'visora_connect_start' ) ); ?>">
							<?php esc_html_e( 'Reconnect (get a new key)', 'visora-connect' ); ?>
						</a>
						<a class="button button-link-delete" href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=visora_connect_disconnect' ), 'visora_connect_disconnect' ) ); ?>"
							onclick="return confirm('<?php echo esc_js( __( 'Disconnect this site from Visora?', 'visora-connect' ) ); ?>');">
							<?php esc_html_e( 'Disconnect', 'visora-connect' ); ?>
						</a>
					</p>
				<?php else : ?>
					<h2 style="margin-top:0;"><?php esc_html_e( 'Not connected', 'visora-connect' ); ?></h2>
					<p><?php esc_html_e( "Connect this site to your Visora account to get an API key — no copy-pasting required.", 'visora-connect' ); ?></p>
					<p>
						<a class="button button-primary button-hero"
							href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=visora_connect_start' ), 'visora_connect_start' ) ); ?>">
							<?php esc_html_e( 'Connect to Visora', 'visora-connect' ); ?>
						</a>
					</p>
					<p class="description">
						<?php esc_html_e( "You'll be asked to log in (or sign up) on visor-a.com, then sent right back here.", 'visora-connect' ); ?>
					</p>
				<?php endif; ?>
			</div>

			<?php if ( $is_connected ) : ?>
			<div class="card" style="max-width:640px;padding:1.5em 2em;margin-top:1.5em;">
				<h2 style="margin-top:0;"><?php esc_html_e( 'Quick start', 'visora-connect' ); ?></h2>
				<p><?php esc_html_e( 'Drop this shortcode anywhere to render a template with live data:', 'visora-connect' ); ?></p>
				<pre style="background:#f0f0f1;padding:1em;overflow-x:auto;">[visora_render template="tpl_ecom_v1" title="Nike Air Max 270" price="3,499 UAH"]</pre>
				<p class="description">
					<?php esc_html_e( 'Every shortcode attribute besides "template" and "format" is passed through as template data.', 'visora-connect' ); ?>
				</p>
			</div>
			<?php endif; ?>

			<div class="card" style="max-width:640px;padding:1.5em 2em;margin-top:1.5em;">
				<h2 style="margin-top:0;"><?php esc_html_e( 'Advanced', 'visora-connect' ); ?></h2>
				<form method="post" action="options.php">
					<?php settings_fields( 'visora_connect_settings' ); ?>
					<table class="form-table" role="presentation">
						<tr>
							<th scope="row"><label for="visora_app_url"><?php esc_html_e( 'Visora app URL', 'visora-connect' ); ?></label></th>
							<td>
								<input name="visora_app_url" id="visora_app_url" type="url" class="regular-text"
									value="<?php echo esc_attr( $app_url ); ?>" />
								<p class="description"><?php esc_html_e( 'Where the Connect button sends you. Only change this if Visora gave you a custom URL (e.g. during a domain migration).', 'visora-connect' ); ?></p>
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="visora_api_url"><?php esc_html_e( 'Render API URL', 'visora-connect' ); ?></label></th>
							<td>
								<input name="visora_api_url" id="visora_api_url" type="url" class="regular-text"
									value="<?php echo esc_attr( $api_url ); ?>" />
								<p class="description"><?php esc_html_e( 'Base URL the [visora_render] shortcode calls.', 'visora-connect' ); ?></p>
							</td>
						</tr>
						<tr>
							<th scope="row"><label for="visora_default_template_id"><?php esc_html_e( 'Default template ID', 'visora-connect' ); ?></label></th>
							<td>
								<input name="visora_default_template_id" id="visora_default_template_id" type="text" class="regular-text"
									value="<?php echo esc_attr( $default_tpl ); ?>" />
								<p class="description"><?php esc_html_e( 'Used when a [visora_render] shortcode omits template="...".', 'visora-connect' ); ?></p>
							</td>
						</tr>
					</table>
					<?php submit_button(); ?>
				</form>
			</div>
		</div>
		<?php
	}
}
