import { v4 as uuidv4 } from 'uuid';

const GmailFactory = require('gmail-js');
const jQuery = require('jquery');

const gmail = new GmailFactory.Gmail(jQuery) as Gmail;

console.log('Running gmailJsLoader');

const baseUrl = 'https://email-tracking-api.herokuapp.com/image.gif';

gmail.observe.on('load', () => {
  const ids: string[] = [];

  console.log('gmail-js loaded!');

  const extension_id = 'lhpahcmgcgljpnfgkgjkhlhfjcobpdjo';
  chrome.runtime.sendMessage(
    extension_id,
    { your: 'message' },
    function (response: any) {
      console.log(response);
      // handle the response
    }
  );

  // gmail.observe.on('view_email', function (obj) {
  //   console.log('Email opened with ID', obj.id);
  // });

  // gmail.observe.before(
  //   'send_message',
  //   function (url: string, body: string, data: any, xhr: any) {
  //     console.log('url:', url, 'body:', body, 'email_data:', data, 'xhr:', xhr);

  //     var body_params = xhr.xhrParams.body_params;
  //     // body_params.subject = 'Subject overwritten!';
  //   }
  // );

  // gmail.observe.on(
  //   'send_scheduled_message',
  //   function (url: string, body: any, data: any, xhr: any) {
  //     console.log('url:', url, 'body', body, 'email_data', data, 'xhr', xhr);
  //   }
  // );

  // gmail.observe.on('compose', (compose) => {
  //   console.log('New compose window is opened!', compose);
  // });

  gmail.observe.after('send_message', async function (url, body, data, xhr) {
    console.log(
      'send_message. url:',
      url,
      'body',
      body,
      'email_data',
      data,
      'xhr',
      xhr
    );

    const parser = new DOMParser();
    const document = parser.parseFromString(data.content_html, 'text/html');
    const trackers = document.getElementsByClassName('tracker-img');
    const urls = Array.from(trackers)
      .map((el) => (el instanceof HTMLImageElement ? el.src : null))
      .filter((src) => !!src) as string[];

    urls.map((src) => src.replace(/^myPrefix/, ''));

    if (trackers) {
      console.log('trackers:', urls, ids);

      try {
        await fetch('https://email-tracking-api.herokuapp.com/report', {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch (e) {
        console.log(e);
      }
    }
  });

  gmail.observe.on('view_thread', function (obj) {
    console.log('view_thread. obj:', obj);
  });

  gmail.observe.on('compose', function (compose, _) {
    console.log('compose', compose, compose.id());

    gmail.tools.add_compose_button(
      compose,
      'Track',
      () => {
        console.log('Track requested!');

        const trackId = uuidv4();
        console.log(`Using id: ${trackId}`);

        // TODO use lib here:
        const url = `${baseUrl}?trackId=${trackId}`;

        const trackingPixelHtml = `<img src="${url}" height="1" width="1" class="tracker-img">`;

        const mail_body = compose.body();
        compose.body(mail_body + trackingPixelHtml);

        ids.push(trackId);

        compose.send();
      },
      'tracker-mail-tracked'
    );

    // compose
    //   .dom('send_button')
    //   .removeAttr('onclick')
    //   .off('click')
    //   .on('click', function (event: any) {
    //     console.log('asdfv', event);
    //     event.preventDefault();
    //   });
    // compose.dom('send_button')[0].addEventListener('click', (e: any) => {
    //   console.log('asdasd');
    //   e.stopImmediatePropagation();
    //   // e.preventDefault();
    // });

    //   const btn = gmail.tools.add_compose_button(
    //     compose,
    //     'Track',
    //     () => {
    //       console.log('Track requested!');

    //       const mail_body = compose.body();

    //       //check if we are tracking
    //       if (mail_body.includes(baseUrl)) {
    //         console.log('Already tracked');
    //         return;
    //       }

    //       const trackId = uuidv4();
    //       console.log(`Using id: ${trackId}`);

    //       // TODO use lib here:
    //       const url = `${baseUrl}?trackId=${trackId}`;

    //       const trackingPixelHtml = `<img src="${url}" height="1" width="1" class="tracker-img">`;
    //       compose.body(mail_body + trackingPixelHtml);

    //       btn.text('Tracked!');
    //     },
    //     'tracker-mail-tracked'
    //   );

    //   // poll to see if we have already inserted
    //   if (btn) {
    //     console.log('Track button added');

    //     const handle = setInterval(() => {
    //       const mail_body = compose.body();
    //       if (mail_body === undefined) {
    //         return;
    //       }
    //       if (mail_body.includes(baseUrl)) {
    //         console.log('Already tracked');
    //         btn.text('Tracked!');
    //       }
    //       clearInterval(handle);
    //     }, 100);
    //   }
  });
});
