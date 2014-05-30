<?php

class AnyTV_News
{
    public static function responseLayout(
        XenForo_ControllerPublic_Page $controller,
        XenForo_ControllerResponse_View $response
    ) {
		$options = $options = XenForo_Application::get('options');
		$response->templateName = 'anytv_news_page';
		$response->params['games'] = AnyTV_Games::getGames();
		$response->params['channel'] = $options->NewsChannel;
		$response->params['playlist'] = $options->NewsPlaylist;
	}
}