import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import useSWR, { SWRResponse } from 'swr';

import { RouteMessage } from '@senses-chat/operator-server/dist/route/models/route.dto';

import { url, fetcher } from 'utils/request';
import { AppLayout } from 'components/AppLayout';
import { Messages } from 'components/Messages';
import {
  handleSessionMessageContent,
  handleWxkfIncomeMessageContent,
} from 'utils/utils';

interface logDetailData {
  _id: string;
  messages: logMessageData[];
}

interface logMessageData {
  message?: RouteMessage;
  metadata: {
    timestamp: string;
  };
}

export default function WxkfMessagesPage() {
  const router = useRouter();
  const { id: sessionId } = router.query;
  const { data }: SWRResponse<logDetailData, Error> = useSWR(
    url(`/api/history/wxkf_msg_logs/${sessionId}`),
    fetcher,
  );

  const messages =
    data?.messages?.map((msg) => {
      const message = msg.message
        ? handleSessionMessageContent(msg.message)
        : handleWxkfIncomeMessageContent(msg);

      return {
        type: msg?.message?.type === 'Wxkf' ? 'bot' : 'user',
        message,
        time: msg.metadata.timestamp,
      };
    }) || [];

  return (
    <AppLayout>
      <Head>
        <title>Wxkf Log Management</title>
      </Head>

      <Messages messages={messages} />
    </AppLayout>
  );
}