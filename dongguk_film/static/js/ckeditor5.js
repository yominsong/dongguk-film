import {
    ClassicEditor,
    AccessibilityHelp,
    Alignment,
    Autoformat,
    AutoImage,
    AutoLink,
    Autosave,
    BalloonToolbar,
    Base64UploadAdapter,
    BlockQuote,
    Bold,
    Code,
    Essentials,
    FindAndReplace,
    FontBackgroundColor,
    FontColor,
    FontFamily,
    FontSize,
    FullPage,
    GeneralHtmlSupport,
    Heading,
    Highlight,
    HorizontalLine,
    HtmlComment,
    HtmlEmbed,
    ImageBlock,
    ImageCaption,
    ImageInline,
    ImageInsert,
    ImageInsertViaUrl,
    ImageResize,
    ImageStyle,
    ImageTextAlternative,
    ImageToolbar,
    ImageUpload,
    Indent,
    IndentBlock,
    Italic,
    Link,
    LinkImage,
    List,
    ListProperties,
    Markdown,
    MediaEmbed,
    // PageBreak,
    Paragraph,
    PasteFromMarkdownExperimental,
    PasteFromOffice,
    RemoveFormat,
    SelectAll,
    // ShowBlocks,
    // SourceEditing,
    SpecialCharacters,
    SpecialCharactersArrows,
    SpecialCharactersCurrency,
    SpecialCharactersEssentials,
    SpecialCharactersLatin,
    SpecialCharactersMathematical,
    SpecialCharactersText,
    Strikethrough,
    // Style,
    Subscript,
    Superscript,
    Table,
    TableCaption,
    TableCellProperties,
    TableColumnResize,
    TableProperties,
    TableToolbar,
    TextPartLanguage,
    TextTransformation,
    // Title,
    TodoList,
    Underline,
    Undo
} from 'ckeditor5-resource';

import translations from 'ckeditor5-ko';

const editorConfig = {
    toolbar: {
        items: [
            'accessibilityHelp',
            '|',
            'undo',
            'redo',
            '|',
            // 'sourceEditing',
            // 'showBlocks',
            '|',
            'heading',
            // 'style',
            '|',
            'fontSize',
            'fontColor',
            'fontBackgroundColor',
            '|',
            'bold',
            'italic',
            'underline',
            'strikethrough',
            'code',
            '|',
            'link',
            'insertImage',
            'mediaEmbed',
            'insertTable',
            'highlight',
            'specialCharacters',
            'blockQuote',
            'horizontalLine',
            '|',
            'alignment',
            '|',
            'bulletedList',
            'numberedList',
            'todoList',
            'outdent',
            'indent',
            '|',
            'selectAll',
            'findAndReplace'
        ],
        shouldNotGroupWhenFull: false
    },
    plugins: [
        AccessibilityHelp,
        Alignment,
        Autoformat,
        AutoImage,
        AutoLink,
        Autosave,
        BalloonToolbar,
        Base64UploadAdapter,
        BlockQuote,
        Bold,
        Code,
        Essentials,
        FindAndReplace,
        FontBackgroundColor,
        FontColor,
        FontFamily,
        FontSize,
        FullPage,
        GeneralHtmlSupport,
        Heading,
        Highlight,
        HorizontalLine,
        HtmlComment,
        HtmlEmbed,
        ImageBlock,
        ImageCaption,
        ImageInline,
        ImageInsert,
        ImageInsertViaUrl,
        ImageResize,
        ImageStyle,
        ImageTextAlternative,
        ImageToolbar,
        ImageUpload,
        Indent,
        IndentBlock,
        Italic,
        Link,
        LinkImage,
        List,
        ListProperties,
        Markdown,
        MediaEmbed,
        // PageBreak,
        Paragraph,
        PasteFromMarkdownExperimental,
        PasteFromOffice,
        RemoveFormat,
        SelectAll,
        // ShowBlocks,
        // SourceEditing,
        SpecialCharacters,
        SpecialCharactersArrows,
        SpecialCharactersCurrency,
        SpecialCharactersEssentials,
        SpecialCharactersLatin,
        SpecialCharactersMathematical,
        SpecialCharactersText,
        Strikethrough,
        // Style,
        Subscript,
        Superscript,
        Table,
        TableCaption,
        TableCellProperties,
        TableColumnResize,
        TableProperties,
        TableToolbar,
        TextPartLanguage,
        TextTransformation,
        // Title,
        TodoList,
        Underline,
        Undo
    ],
    balloonToolbar: ['bold', 'italic', '|', 'link', 'insertImage', '|', 'bulletedList', 'numberedList'],
    fontFamily: {
        supportAllValues: true
    },
    fontSize: {
        options: [10, 12, 14, 'default', 18, 20, 22],
        supportAllValues: true
    },
    heading: {
        options: [
            {
                model: 'paragraph',
                title: 'Paragraph',
                class: 'ck-heading_paragraph'
            },
            {
                model: 'heading1',
                view: 'h1',
                title: 'Heading 1',
                class: 'ck-heading_heading1'
            },
            {
                model: 'heading2',
                view: 'h2',
                title: 'Heading 2',
                class: 'ck-heading_heading2'
            },
            {
                model: 'heading3',
                view: 'h3',
                title: 'Heading 3',
                class: 'ck-heading_heading3'
            },
            {
                model: 'heading4',
                view: 'h4',
                title: 'Heading 4',
                class: 'ck-heading_heading4'
            },
            {
                model: 'heading5',
                view: 'h5',
                title: 'Heading 5',
                class: 'ck-heading_heading5'
            },
            {
                model: 'heading6',
                view: 'h6',
                title: 'Heading 6',
                class: 'ck-heading_heading6'
            }
        ]
    },
    htmlSupport: {
        allow: [
            {
                name: /^.*$/,
                styles: true,
                attributes: true,
                classes: true
            }
        ]
    },
    image: {
        toolbar: [
            'toggleImageCaption',
            'imageTextAlternative',
            '|',
            'imageStyle:inline',
            'imageStyle:wrapText',
            'imageStyle:breakText',
            '|',
            'resizeImage'
        ]
    },
    initialData: '',
    language: 'ko',
    link: {
        addTargetToExternalLinks: true,
        defaultProtocol: 'https://',
        decorators: {
            toggleDownloadable: {
                mode: 'manual',
                label: 'Downloadable',
                attributes: {
                    download: 'file'
                }
            }
        }
    },
    list: {
        properties: {
            styles: true,
            startIndex: true,
            reversed: true
        }
    },
    menuBar: {
        isVisible: false
    },
    placeholder: '여기에 내용을 입력하세요.',
    // style: {
    //     definitions: [
    //         {
    //             name: 'Article category',
    //             element: 'h3',
    //             classes: ['category']
    //         },
    //         {
    //             name: 'Title',
    //             element: 'h2',
    //             classes: ['document-title']
    //         },
    //         {
    //             name: 'Subtitle',
    //             element: 'h3',
    //             classes: ['document-subtitle']
    //         },
    //         {
    //             name: 'Info box',
    //             element: 'p',
    //             classes: ['info-box']
    //         },
    //         {
    //             name: 'Side quote',
    //             element: 'blockquote',
    //             classes: ['side-quote']
    //         },
    //         {
    //             name: 'Marker',
    //             element: 'span',
    //             classes: ['marker']
    //         },
    //         {
    //             name: 'Spoiler',
    //             element: 'span',
    //             classes: ['spoiler']
    //         },
    //         {
    //             name: 'Code (dark)',
    //             element: 'pre',
    //             classes: ['fancy-code', 'fancy-code-dark']
    //         },
    //         {
    //             name: 'Code (bright)',
    //             element: 'pre',
    //             classes: ['fancy-code', 'fancy-code-bright']
    //         }
    //     ]
    // },
    table: {
        contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
    },
    translations: [translations]
};

const isUserAuthenticated = document.querySelector("#id_mobile_logout_btn") !== null ? true : false
let ckElements, toolbarViewRoot, textboxModel, textboxViewRoot;

if (isUserAuthenticated) {
    ClassicEditor
    .create(document.querySelector('#id_content'), editorConfig)
    .then(editor => {
        window.id_editor = editor;
        ckElements = Array.from(document.querySelectorAll(".ck")).filter(element => !(element instanceof SVGElement));
        // toolbarViewRoot = editor.ui.view.toolbar.element;
        textboxModel = editor.model.document;
        textboxViewRoot = editor.editing.view.getDomRoot();

        textboxModel.on("change:data", () => {
            const data = editor.getData();

            if (!hasOnlyImages(data)) {
                displayNoti(false, "IMAGE_DESCRIPTION_TEXT_REQUIRED");
            } else if (hasOnlyImages(data)) {
                displayNoti(false, "EXTRACTING_TEXT_FROM_IMAGE_SUCCEEDED");
                displayNoti(false, "EXTRACTING_TEXT_FROM_IMAGE_FAILED");
                displayNoti(true, "IMAGE_DESCRIPTION_TEXT_REQUIRED");
            };
        });

        ckElements.forEach((ck) => {
            ck.addEventListener("focus", () => {
                displayError(false, id_content);
                displayButtonMsg(false, id_create_or_update, "error");
            });

            ck.addEventListener("blur", event => {
                if (!ckElements.includes(event.relatedTarget)) {
                    if ((!editor.getData() || editor.getData().trim() === "")) {
                        displayError(true, id_content, "empty");
                    } else {
                        displayError(false, id_content);
                        displayButtonMsg(false, id_create_or_update, "error");
                    };
                };
            });

            ck.addEventListener("keydown", event => {
                if (ck === textboxViewRoot && event.shiftKey && event.key === "Tab") {
                    const id_category_error = code(id_category, "_error");

                    if (id_category_error.innerText.length === 0) {
                        setTimeout(() => {
                            // toolbarViewRoot.querySelector(".ck-toolbar__items").querySelector("button").focus();
                            displayError(false, id_category);
                        });
                    } else {
                        // setTimeout(() => {
                        //     toolbarViewRoot.querySelector(".ck-toolbar__items").querySelector("button").focus();
                        // });
                    };
                };
            });

            ck.addEventListener("click", () => {
                displayError(false, id_content);
                displayButtonMsg(false, id_create_or_update, "error");
                displayNoti(false, "EXTRACTING_TEXT_SUCCEEDED");
                displayNoti(false, "NO_IMAGES_FOUND");
                displayNoti(false, "EXTRACTING_TEXT_FAILED");
            });

            eventTypes.forEach(type => {
                ck.addEventListener(type, () => { textboxViewRoot.setAttribute("spellcheck", "false") });
            });
        });

        return editor;
    });
};