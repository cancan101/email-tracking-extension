import { v4 as uuidv4 } from 'uuid';
import jQuery from 'jquery';
import { decodeJwt } from 'jose';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';

import InboxViewList from './containers/InboxViewList';
import ThreadViewList from './containers/ThreadViewList';
import LoginButton from './containers/LoginButton';
import TrackingButton from './containers/TrackingButton';
import ThreadTrackingButton from './containers/ThreadTrackingButton';
import useStore from './containers/store';
import { View } from './types';
import './sentry';

// import style required for TS to work
const GmailFactory = require('gmail-js');

// -------------------------------------------------

dayjs.extend(localizedFormat);

// -------------------------------------------------

// required to make TS happy
const gmail = new GmailFactory.Gmail(jQuery) as Gmail;

// -------------------------------------------------

const extensionId = document.currentScript?.dataset.extensionId ?? '';
// TODO(cancan101): handle missing extensionId

const baseUrl = process.env.EMAIL_TRACKING_BACKEND_URL;
const imageBaseUrl = `${baseUrl}/t`;
const reportUrl = `${baseUrl}/api/v1/trackers/`;
const infoUrl = `${baseUrl}/api/v1/threads/:threadId/views/`;
const dashboardUrl = `${baseUrl}/api/v1/views/`;
const loginUrl = `${baseUrl}/api/v1/login/request-magic`;

const btnTrackingClass = 'btn-tracking';
const btnLoginClass = 'btn-login';
const btnTrackingThreadClass = 'btn-trackingThread';
const btnManageMarginClass = 'btn-manageMargin';

// -------------------------------------------------

const INBOX_VIEW_LIST_MAX_SHOWN = 20;

// -------------------------------------------------

console.log(
  `Running gmailJsLoader w/ extensionId: ${extensionId}; baseUrl: ${baseUrl}`
);

// -------------------------------------------------

function getTrackerHTMLImg(url: string): string {
  return `<img src="${url}" data-src="${url}" loading="lazy" height="1" width="1" style="border:0; width:1; height:1; overflow:hidden; display:none !important;" class="tracker-img">`;
}

function getTrackerHTMLBackground(url: string): string {
  return `<div height="1" width="1" style="background-image: url('${url}');" data-src="${url}" class="tracker-img"></div>`;
}

function getTrackerHTML(url: string): string {
  return getTrackerHTMLBackground(url);
}

function getAuthorization(): string | null {
  const accessToken = useStore.getState().getValidAccessToken();
  if (accessToken === null) {
    return null;
  }
  return `Bearer ${accessToken}`;
}

async function fetchAuth(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> {
  const authorization = getAuthorization();
  if (authorization === null) {
    throw new Error('Not logged in');
  }

  return await fetch(input, {
    ...(init ?? {}),
    headers: { ...(init?.headers ?? {}), Authorization: authorization },
  });
}

// -------------------------------------------------

const popoutThreadConfig = {
  class: 'nH',
  sub_selector: 'div.iC',
  handler: function (match: JQuery<HTMLElement>, callback: any) {
    setTimeout(() => {
      callback(match);
    });
  },
};

gmail.observe.register('popout_thread', popoutThreadConfig);

(gmail.observe as any).on_dom(
  'popout_thread',
  function (obj: JQuery<HTMLElement>) {
    const handle = setInterval(() => {
      const threadElem = obj[0].querySelector<HTMLElement>(
        '[data-thread-perm-id]'
      );
      if (threadElem) {
        clearInterval(handle);

        const threadId: string | undefined = threadElem.dataset['threadPermId'];
        if (threadId) {
          console.log('popout_thread. threadId:', threadId);
          useStore.setState({ isPopout: true });
          setupInThread(threadId);
        } else {
          console.log('popout_thread no threadId', threadElem);
        }
      }
    }, 100);
  }
);

const closeModal = () => {
  unmountComponentAtNode(jQuery('#gmailJsModalWindowContent')[0]);
  gmail.tools.remove_modal_window();
};

const showThreadViews = (views: View[] | null) => {
  gmail.tools.add_modal_window(
    'Tracking information',
    '',
    closeModal,
    closeModal,
    closeModal
  );
  render(
    React.createElement(ThreadViewList, { views }, null),
    jQuery('#gmailJsModalWindowContent')[0]
  );
  jQuery('#gmailJsModalWindowCancel').hide();
};

const getThreadViews = async (threadId: string): Promise<View[] | null> => {
  try {
    const resp = await fetchAuth(infoUrl.replace(':threadId', threadId));
    if (resp.ok) {
      const responseData = await resp.json();
      return responseData.data ?? null;
    }
  } catch (e) {
    console.log(e);
  }
  return null;
};

const setupInThread = (threadId: string) => {
  const btnTrackingThread = gmail.tools.add_toolbar_button(
    null as any as string,
    null as any as Function,
    `${btnTrackingThreadClass} ${btnManageMarginClass}`
  );
  btnTrackingThread.children().off('click');
  const btnTrackingThreadBtnContainer = document.createElement('div');
  // can we de-jquery some
  jQuery(btnTrackingThread.children()[0]).append(
    jQuery(btnTrackingThreadBtnContainer)
  );

  const threadTrackingButtonElement = React.createElement(
    ThreadTrackingButton,
    {
      getThreadViews: () => getThreadViews(threadId),
      showThreadViews,
    },
    null
  );
  render(threadTrackingButtonElement, btnTrackingThreadBtnContainer);

  const observer = new MutationObserver(function (mutations_list) {
    mutations_list.forEach(function (mutation) {
      mutation.removedNodes.forEach(function (removed_node) {
        if (removed_node.contains(btnTrackingThread[0])) {
          unmountComponentAtNode(btnTrackingThreadBtnContainer);
          observer.disconnect();
        }
      });
    });
  });
  const bar = jQuery('[gh="tm"]');
  observer.observe(bar.parent()[0], {
    subtree: true,
    childList: true,
  });
};

gmail.observe.on('view_thread', function (obj) {
  const threadElem = obj
    .dom()[0]
    .querySelector<HTMLElement>('[data-thread-perm-id]');
  if (threadElem) {
    const threadId: string | undefined = threadElem.dataset['threadPermId'];
    if (threadId) {
      const threadData = gmail.new.get.thread_data(threadId);

      console.log('view_thread. obj:', obj, threadId, threadData);

      setTimeout(() => {
        useStore.setState({ isInsideEmail: true });
        setupInThread(threadId);
      }, 0);
    }
  }
});

// -------------------------------------------------

// https://web.dev/constructable-stylesheets/
// const stylesheet = new CSSStyleSheet();
// stylesheet.insertRule(
//   '.tracker-mail-tracked { background-color: green !important; }'
// );
// document.adoptedStyleSheets = [stylesheet];

// -------------------------------------------------

const ids: string[] = [];
const messageToTracker = new Map<string, string>();

// Listen for "login" notification
window.addEventListener(
  'login-notice',
  function (event: any) {
    const userEmailIncoming = event.detail.emailAccount;
    const { userEmail } = useStore.getState();
    console.log('login-notice', userEmail, userEmailIncoming, event.detail);
    if (userEmail !== null && userEmail === userEmailIncoming) {
      requestStorage();
    }
  },
  false
);
window.addEventListener(
  'logout-notice',
  function (event: any) {
    const userEmailIncoming = event.detail.emailAccount;
    const { userEmail } = useStore.getState();
    console.log('logout-notice', userEmail, userEmailIncoming, event.detail);
    if (
      userEmailIncoming == null ||
      (userEmail !== null && userEmail === userEmailIncoming)
    ) {
      processLogout();
    }
  },
  false
);
// window.dispatchEvent(new CustomEvent('get-settings-data'));

function renderTrackingInfo(views: View[]) {
  gmail.tools.add_modal_window(
    'Tracking information',
    '',
    closeModal,
    closeModal,
    closeModal
  );
  render(
    React.createElement(InboxViewList, { views, closeModal }, null),
    jQuery('#gmailJsModalWindowContent')[0]
  );
  jQuery('#gmailJsModalWindowCancel').hide();
}

async function getUserViews(): Promise<View[] | null> {
  const userId = useStore.getState().userInfo?.userId;
  if (userId === undefined) {
    throw new Error('No userId');
  }
  const resp = await fetchAuth(
    `${dashboardUrl}?userId=${userId}&limit=${INBOX_VIEW_LIST_MAX_SHOWN}`
  );
  if (resp.ok) {
    const respData = await resp.json();
    if (respData.data !== null) {
      const allViews = respData.data as View[];
      return allViews.slice(0, INBOX_VIEW_LIST_MAX_SHOWN);
    }
  }
  return null;
}

const trackingBtnContainer = document.createElement('div');

function setupTracking() {
  const buttons = jQuery(`[gh="mtb"] .${btnTrackingClass}`);
  if (buttons.length === 0) {
    const container = gmail.tools.add_toolbar_button(
      null as any as string,
      null as any as Function,
      `${btnTrackingClass} ${btnManageMarginClass}`
    );
    container.children().off('click');
    jQuery(container.children()[0]).append(jQuery(trackingBtnContainer));

    const trackingButtonElement = React.createElement(
      TrackingButton,
      {
        getUserViews,
        renderTrackingInfo,
      },
      null
    );
    render(trackingButtonElement, trackingBtnContainer);
  } else if (buttons.parent().attr('style') != null) {
    // https://github.com/KartikTalwar/gmail.js/issues/518#issuecomment-1132242028
    buttons.parent().attr('style', null);
  } else if (buttons.children().length === 0) {
    // we have to re-attach the container
    buttons.append(jQuery(trackingBtnContainer));
  }
  // maybe move
  useStore.setState({ isInsideEmail: gmail.check.is_inside_email() });
}

const requestLogin = async () => {
  const emailAccount = useStore.getState().userEmail;

  await fetch(loginUrl, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({ email: emailAccount }),
  });
};

const loginBtnContainer = document.createElement('div');

function setupLogin() {
  const buttons = jQuery(`[gh="mtb"] .${btnLoginClass}`);
  if (buttons.length === 0) {
    const container = gmail.tools.add_toolbar_button(
      null as any as string,
      null as any as Function,
      `${btnLoginClass} ${btnManageMarginClass}`
    );
    container.children().off('click');
    jQuery(container.children()[0]).append(jQuery(loginBtnContainer));

    const loginButtonElement = React.createElement(
      LoginButton,
      {
        requestLogin,
      },
      null
    );
    render(loginButtonElement, loginBtnContainer);
  } else if (buttons.parent().attr('style') != null) {
    // https://github.com/KartikTalwar/gmail.js/issues/518#issuecomment-1132242028
    buttons.parent().attr('style', null);
  } else if (buttons.children().length === 0) {
    // we have to re-attach the container
    buttons.append(jQuery(loginBtnContainer));
  }
}

gmail.observe.on('load', () => {
  const userEmail = gmail.get.user_email();
  useStore.setState({ userEmail });

  console.log('gmail-js loaded!', userEmail);
  requestStorage();

  setInterval(function () {
    setupTracking();
    setupLogin();
  }, 500);

  type ReportData = {
    emailId: string;
    threadId: string;
    trackId: string;
    emailSubject: string;
    scheduledTimestamp?: number;
    selfLoadMitigation: boolean;
  };

  async function processSend(
    body: string,
    data: any,
    xhr: XMLHttpRequest,
    isScheduled: boolean
  ) {
    if (xhr.readyState === 4 && xhr.status === 0) {
      console.log('Issue with send');
      return;
    }

    const emailId = data.id;
    console.log('Email ID:', emailId);

    const bodyData = JSON.parse(body);
    // const threadId = response[2]?.[6]?.[0]?.[1]?.[1];
    // const threadId = bodyData[2]?.[1]?.[0]?.[2]?.[1];
    const threadId = bodyData[1]?.[0]?.[0][1]?.[0];
    console.log('Thread ID:', threadId);
    // console.log('data:', data);
    // console.log('body:', JSON.parse(body));

    const emailSubject = data.subject;
    console.log('emailSubject:', emailSubject);

    const parser = new DOMParser();
    const document = parser.parseFromString(data.content_html, 'text/html');
    const trackers = document.getElementsByClassName('tracker-img');

    const urls = Array.from(trackers)
      .map((el) => (el instanceof HTMLElement ? el.dataset.src : null))
      .filter((src) => !!src && src.startsWith(imageBaseUrl)) as string[];

    // console.log(
    //   Array.from(trackers).map((el) =>
    //     el instanceof HTMLImageElement ? el.dataset.src : null
    //   )
    // );

    // 38 is length of uuid
    const trackIds = urls.map((src) =>
      src.slice(imageBaseUrl.length + 38, -'image.gif'.length - 1)
    );

    if (trackIds.length > 0) {
      console.log('trackers:', trackIds, ids);

      // figure out if we want to send all trackers or just one
      const trackId = trackIds[trackIds.length - 1];
      const trackIdIdx = ids.indexOf(trackId);

      console.log('trackId:', trackId, 'trackIdIdx', trackIdIdx);

      if (trackIdIdx >= 0) {
        ids.splice(trackIdIdx, 1);
      } else {
        // If we send from popout we won't be tracking the trackerId
        // throw Error('Unknown trackerId');
      }

      // We will assume this is always true
      const selfLoadMitigation = true;

      const reportData: ReportData = {
        emailId,
        threadId,
        trackId,
        emailSubject,
        selfLoadMitigation,
      };

      if (isScheduled) {
        reportData['scheduledTimestamp'] = data.timestamp as number;
      }

      try {
        // TODO: do this in then
        await fetchAuth(reportUrl, {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify(reportData),
        });
      } catch (e) {
        console.log(e);
      }
    } else {
      console.log('No trackers found in email');
    }
  }

  gmail.observe.after(
    'send_scheduled_message',
    async function (
      url: string,
      body: string,
      data: any,
      response: any,
      xhr: XMLHttpRequest
    ) {
      console.log('send_scheduled_message...');

      await processSend(body, data, xhr, true);
    }
  );

  gmail.observe.after(
    'send_message',
    async function (url, body, data, response, xhr): Promise<void> {
      console.log('send_message...');

      await processSend(body, data, xhr, false);
    }
  );
});

gmail.observe.on('compose', function (compose, _) {
  console.log('compose', compose, compose.id());
  if (!useStore.getState().isLoggedIn()) {
    return;
  }

  // TODO(cancan101): figure out if the window is re-opened due to a failed send
  setTimeout(() => {
    const scheduledSend = compose.find('.J-N.yr').first()[0];

    gmail.tools.add_more_send_option(
      compose,
      'Scheduled Track',
      () => {
        console.log('Track requested (scheduled send)!');

        injectTracking();

        scheduledSend.dispatchEvent(
          new MouseEvent('mouseenter', { bubbles: true })
        );
        scheduledSend.dispatchEvent(
          new MouseEvent('mousedown', { bubbles: true })
        );
        scheduledSend.dispatchEvent(
          new MouseEvent('mouseup', { bubbles: true })
        );
      },
      undefined,
      'v5'
    );

    const secondarySend = compose
      .dom()
      .find('div.T-I.T-I-ax7.aoO:not(.gmailjscomposebutton)');

    if (secondarySend.length > 0) {
      gmail.tools.add_more_send_option(
        compose,
        'Track Send (no archive)',
        () => {
          console.log('Track requested (secondary send)!');

          injectTracking();

          secondarySend.click();
        },
        undefined,
        'bq5 move_to_inbox_googblue'
      );
    }
  }, 0);

  let wasInjected = false;
  function injectTracking() {
    if (wasInjected) {
      console.log('We already injected in this compose');
      return;
    }

    const email_id = compose.email_id();
    if (messageToTracker.has(email_id)) {
      console.log('We already injected in this message');
      return;
    }

    const trackingSlug = useStore.getState().userInfo?.trackingSlug;
    if (trackingSlug === undefined) {
      throw new Error('No trackingSlug');
    }

    const trackId = uuidv4();
    console.log(`Using id: ${trackId}`);

    messageToTracker.set(email_id, trackId);

    // TODO use lib here:
    const url = `${imageBaseUrl}/${trackingSlug}/${trackId}/image.gif`;

    const trackingPixelHtml = getTrackerHTML(url);

    const mail_body = compose.body();

    // TODO(cancan101): remove old trackers
    compose.body(mail_body + trackingPixelHtml);

    ids.push(trackId);
    wasInjected = true;
  }

  gmail.tools.add_compose_button(
    compose,
    'Track',
    () => {
      console.log('Track requested!');

      injectTracking();

      compose.send();
    },
    'tracker-mail-tracked'
  );
});

let clearUserInfoHandle: number | null = null;
function requestStorage() {
  const emailAccount = useStore.getState().userEmail;
  console.log('requestStorage::requesting', emailAccount);
  if (emailAccount === null) {
    return;
  }
  chrome.runtime.sendMessage(
    extensionId,
    { your: 'STORAGE', emailAccount },
    function (response: any): void {
      if (response == null) {
        return;
      }
      // handle the response
      console.log('requestStorage:response', response);

      const accessToken = response.accessToken as string;
      const expiresAt = response.expiresAt as number;
      const trackingSlug = response.trackingSlug as string;

      const claims = decodeJwt(accessToken);
      if (!claims.sub) {
        console.log('Missing sub claim');
        return;
      }
      const sub = claims.sub;
      const userInfo = { accessToken, expiresAt, trackingSlug, userId: sub };

      console.log('Setting userInfo', userInfo);
      useStore.setState({
        userInfo,
      });

      const slop = 1000;
      const inFutureMs = expiresAt * 1000 - new Date().getTime() - slop;
      console.log('userInfo will expire in (ms):', inFutureMs);
      if (clearUserInfoHandle) {
        clearTimeout(clearUserInfoHandle);
      }
      clearUserInfoHandle = window.setTimeout(processLogout, inFutureMs);
    }
  );
}

const processLogout = () => {
  clearUserInfoHandle = null;
  console.log(
    'Clearing userInfo',
    new Date().getTime() / 1000,
    useStore.getState().userInfo?.expiresAt
  );
  useStore.setState({ userInfo: null });
};

/*
async function sendTestMessage(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const { userEmail } = useStore.getState();
    chrome.runtime.sendMessage(
      extensionId,
      { your: 'TEST', emailAccount: userEmail },
      function (response: any): void {
        resolve(response.foo);
      }
    );
  });
}
*/
