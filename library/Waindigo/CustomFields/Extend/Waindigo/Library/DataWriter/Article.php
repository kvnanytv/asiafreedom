<?php

/**
 *
 * @see Waindigo_Library_DataWriter_Article
 */
class Waindigo_CustomFields_Extend_Waindigo_Library_DataWriter_Article_Base extends XFCP_Waindigo_CustomFields_Extend_Waindigo_Library_DataWriter_Article
{

    const DATA_THREAD_FIELD_DEFINITIONS = 'threadFields';

    /**
     * The custom fields to be updated.
     * Use setCustomFields to manage this.
     *
     * @var array
     */
    protected $_updateCustomFields = array();

    /**
     *
     * @see Waindigo_Library_DataWriter_Article::_getFields()
     */
    protected function _getFields()
    {
        $fields = parent::_getFields();

        $fields['xf_article']['custom_fields'] = array(
            'type' => self::TYPE_SERIALIZED,
            'default' => ''
        );

        return $fields;
    } /* END _getFields */

    /**
     *
     * @see Waindigo_Library_DataWriter_Article::_discussionPreSave()
     */
    protected function _discussionPreSave()
    {
        $node = $this->_getLibraryModel()->getLibraryById($this->get('node_id'));

        if (isset($GLOBALS['Waindigo_Library_ControllerPublic_Library'])) {
            /* @var $controller Waindigo_Library_ControllerPublic_Library */
            $controller = $GLOBALS['Waindigo_Library_ControllerPublic_Library'];

            $fieldValues = array();
            if (isset($node['custom_fields']) && $node['custom_fields']) {
                $fieldValues = unserialize($node['custom_fields']);
            }

            $customFields = $controller->getInput()->filterSingle('custom_fields', XenForo_Input::ARRAY_SIMPLE);
            $customFieldsShown = $controller->getInput()->filterSingle('custom_fields_shown', XenForo_Input::STRING,
                array(
                    'array' => true
                ));

            foreach ($fieldValues as $fieldName => $fieldValue) {
                if (!in_array($fieldName, $customFieldsShown)) {
                    $customFieldsShown[] = $fieldName;
                    $customFields[$fieldName] = $fieldValue;
                }
            }

            $this->setCustomFields($customFields, $customFieldsShown);
        }

        if (isset($GLOBALS['Waindigo_Library_ControllerPublic_Article'])) {
            /* @var $controller Waindigo_Library_ControllerPublic_Article */
            $controller = $GLOBALS['Waindigo_Library_ControllerPublic_Article'];

            if (strtolower($controller->getRouteMatch()->getAction()) == 'save') {
                $customFields = $controller->getInput()->filterSingle('custom_fields', XenForo_Input::ARRAY_SIMPLE);
                $customFieldsShown = $controller->getInput()->filterSingle('custom_fields_shown', XenForo_Input::STRING,
                    array(
                        'array' => true
                    ));

                $this->setCustomFields($customFields, $customFieldsShown);
            }
        }

        $nodeRequiredFields = array();
        if (isset($node['required_fields']) && $node['required_fields']) {
            $nodeRequiredFields = unserialize($node['required_fields']);
        }

        $customFields = $this->get('custom_fields');
        if ($customFields) {
            $customFields = unserialize($customFields);
        }

        foreach ($nodeRequiredFields as $fieldId) {
            if (!isset($customFields[$fieldId]) ||
                 ($customFields[$fieldId] === '' || $customFields[$fieldId] === array())) {
                $this->error(new XenForo_Phrase('please_enter_value_for_all_required_fields'), "custom_field_$fieldId");
                continue;
            }
        }

        parent::_discussionPreSave();
    } /* END _discussionPreSave */

    protected function _customFieldsPostSave(array $messages = array())
    {
        if (XenForo_Application::$versionId < 1020000) {
            parent::_discussionPostSave($messages);
        } else {
            parent::_discussionPostSave();
        }

        $this->updateCustomFields();

        $this->_associateCustomFieldsAttachments();
    } /* END _customFieldsPostSave */

    /**
     *
     * @param array $fieldValues
     * @param array $fieldsShown
     */
    public function setCustomFields(array $fieldValues, array $fieldsShown = null)
    {
        if ($fieldsShown === null) {
            // not passed - assume keys are all there
            $fieldsShown = array_keys($fieldValues);
        }

        $fieldModel = $this->_getFieldModel();
        $fields = $this->_getThreadFieldDefinitions();
        $callbacks = array();

        if ($this->get('article_id') && !$this->_importMode) {
            $existingValues = $fieldModel->getArticleFieldValues($this->get('article_id'));
        } else {
            $existingValues = array();
        }

        $finalValues = array();

        $defaultValues = $fieldModel->getDefaultThreadFieldValues($this->get('node_id'));

        foreach ($defaultValues as $fieldId => $value) {
            if (!in_array($fieldId, $fieldsShown) && $value != '' && $value != array()) {
                $fieldsShown[] = $fieldId;
                $fieldValues[$fieldId] = $value;
            }
        }

        foreach ($fieldsShown as $fieldId) {
            if (!isset($fields[$fieldId])) {
                continue;
            }

            $field = $fields[$fieldId];
            if ($field['field_type'] == 'callback') {
                if (isset($fieldValues[$fieldId])) {
                    if (is_array($fieldValues[$fieldId])) {
                        $fieldValues[$fieldId] = serialize($fieldValues[$fieldId]);
                        $callbacks[] = $fieldId;
                    }
                }
                $field['field_type'] = 'textbox';
            }
            $multiChoice = ($field['field_type'] == 'checkbox' || $field['field_type'] == 'multiselect');

            if ($multiChoice) {
                // multi selection - array
                $value = (isset($fieldValues[$fieldId]) && is_array($fieldValues[$fieldId])) ? $fieldValues[$fieldId] : array();
            } else {
                // single selection - string
                $value = (isset($fieldValues[$fieldId]) ? strval($fieldValues[$fieldId]) : '');
            }

            $existingValue = (isset($existingValues[$fieldId]) ? $existingValues[$fieldId] : null);

            if (!$this->_importMode) {
                $error = '';
                $valid = $fieldModel->verifyThreadFieldValue($field, $value, $error);
                if (!$valid) {
                    $this->error($error, "custom_field_$fieldId");
                    continue;
                }
            }

            foreach ($callbacks as $callbackFieldId) {
                if (isset($fieldValues[$callbackFieldId])) {
                    if (is_array($fieldValues[$callbackFieldId])) {
                        $value = unserialize($value);
                    }
                }
            }

            if ($value !== $existingValue) {
                $finalValues[$fieldId] = $value;
            }
        }

        $this->_updateCustomFields = $finalValues + $this->_updateCustomFields;
        $this->set('custom_fields', $finalValues + $existingValues);
    } /* END setCustomFields */

    public function updateCustomFields()
    {
        if ($this->_updateCustomFields) {
            $articleId = $this->get('article_id');

            foreach ($this->_updateCustomFields as $fieldId => $value) {
                if (is_array($value)) {
                    $value = serialize($value);
                }
                $this->_db->query(
                    '
                    INSERT INTO xf_article_field_value
                    (article_id, field_id, field_value)
                    VALUES
                    (?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    field_value = VALUES(field_value)
                    ',
                    array(
                        $articleId,
                        $fieldId,
                        $value
                    ));
            }
        }
    } /* END updateCustomFields */

    protected function _associateCustomFieldsAttachments()
    {
        $fieldAttachmentModel = $this->getModelFromCache('Waindigo_CustomFields_Model_Attachment');

        $fieldAttachmentModel->associateAttachments($this->get('article_id'), 'article');
    } /* END _associateCustomFieldsAttachments */

    /**
     * Fetch (and cache) user field definitions
     *
     * @return array
     */
    protected function _getThreadFieldDefinitions()
    {
        $fields = $this->getExtraData(self::DATA_THREAD_FIELD_DEFINITIONS);

        if (is_null($fields)) {
            $fields = $this->_getFieldModel()->getThreadFields();

            $this->setExtraData(self::DATA_THREAD_FIELD_DEFINITIONS, $fields);
        }

        return $fields;
    } /* END _getThreadFieldDefinitions */

    protected function _customFieldsPostDelete(array $messages = array())
    {
        $db = $this->_db;
        $articleId = $this->get('article_id');
        $articleIdQuoted = $db->quote($articleId);

        $db->delete('xf_article_field_value', "article_id = $articleIdQuoted");

        if (XenForo_Application::$versionId < 1020000) {
            parent::_discussionPostDelete($messages);
        } else {
            parent::_discussionPostDelete();
        }
    } /* END _customFieldsPostDelete */

    /**
     *
     * @return Waindigo_Library_Model_Library
     */
    protected function _getLibraryModel()
    {
        return $this->getModelFromCache('Waindigo_Library_Model_Library');
    } /* END _getLibraryModel */

    /**
     *
     * @return Waindigo_CustomFields_Model_ThreadField
     */
    protected function _getFieldModel()
    {
        return $this->getModelFromCache('Waindigo_CustomFields_Model_ThreadField');
    } /* END _getFieldModel */
}

if (XenForo_Application::$versionId < 1020000) {

    class Waindigo_CustomFields_Extend_Waindigo_Library_DataWriter_Article extends Waindigo_CustomFields_Extend_Waindigo_Library_DataWriter_Article_Base
    {

        /**
         *
         * @see XenForo_DataWriter_Discussion_Thread::_discussionPostSave()
         */
        protected function _discussionPostSave(array $messages)
        {
            $this->_customFieldsPostSave($messages);
        } /* END _discussionPostSave */

        /**
         *
         * @see XenForo_DataWriter_Discussion_Thread::_discussionPostDelete()
         */
        protected function _discussionPostDelete(array $messages)
        {
            $this->_customFieldsPostDelete($messages);
        } /* END _discussionPostDelete */
    }
} else {

    class Waindigo_CustomFields_Extend_Waindigo_Library_DataWriter_Article extends Waindigo_CustomFields_Extend_Waindigo_Library_DataWriter_Article_Base
    {

        /**
         *
         * @see Waindigo_Library_DataWriter_Article::_discussionPostSave()
         */
        protected function _discussionPostSave()
        {
            $this->_customFieldsPostSave();
        } /* END _discussionPostSave */

        /**
         *
         * @see Waindigo_Library_DataWriter_Article::_discussionPostDelete()
         */
        protected function _discussionPostDelete()
        {
            $this->_customFieldsPostDelete();
        } /* END _discussionPostDelete */
    }
}