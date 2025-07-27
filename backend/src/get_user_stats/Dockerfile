FROM public.ecr.aws/lambda/python:3.11

# Copy requirements and install dependencies
COPY src/get_user_stats/requirements.txt .
RUN pip install -r requirements.txt

# Copy common modules
COPY src/habits_common ${LAMBDA_TASK_ROOT}/habits_common

# Copy function code
COPY src/get_user_stats/handler.py ${LAMBDA_TASK_ROOT}/

# Set the handler
CMD ["handler.handler"]
